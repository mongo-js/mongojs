const thunky = require('thunky')
const { Readable } = require('readable-stream').Readable

let hooks

try {
  hooks = require('async_hooks')
} catch (err) {}

class Cursor extends Readable {
  constructor (getCursor) {
    super({ objectMode: true, highWaterMark: 0 })

    this._opts = {}

    this._destroyed = false
    this._hook = hooks && new hooks.AsyncResource('mongojs:cursor')
    this._get = thunky((cb) => {
      getCursor((err, cursor) => {
        if (err) { return cb(err) }

        // Apply all opts
        for (const key in this._opts) {
          if (Object.prototype.hasOwnProperty.call(this._opts, key)) {
            cursor = cursor[key](this._opts[key])
          }
        }

        cb(null, cursor)
      })
    })
  }

  next (cb) {
    if (this._hook) cb = wrapHook(this, cb)

    this._get((err, cursor) => {
      if (err) return cb(err)

      if (cursor.cursorState.dead || cursor.cursorState.killed) {
        destroy(this)
        return cb(null, null)
      } else {
        cursor.next(cb)
      }
    })

    return this
  }

  rewind (cb) {
    if (this._hook) cb = wrapHook(this, cb)

    this._get((err, cursor) => {
      if (err) return cb(err)
      cursor.rewind(cb)
    })

    return this
  }

  toArray (cb) {
    const array = []

    const loop = () => {
      this.next((err, obj) => {
        if (err) return cb(err)
        if (!obj) return cb(null, array)
        array.push(obj)

        // Fix for #270 RangeError: Maximum call stack size exceeded using Collection.find
        setImmediate(loop)
      })
    }

    loop()
  }

  map (mapfn, cb) {
    const array = []

    const loop = () => {
      this.next((err, obj) => {
        if (err) return cb(err)
        if (!obj) return cb(null, array)
        array.push(mapfn(obj))

        // Fix for #270 RangeError: Maximum call stack size exceeded using Collection.find
        setImmediate(loop)
      })
    }

    loop()
  }

  forEach (fn) {
    const loop = () => {
      this.next((err, obj) => {
        if (err) return fn(err)
        fn(err, obj)

        if (!obj) return

        // Fix for #270 RangeError: Maximum call stack size exceeded using Collection.find
        setImmediate(loop)
      })
    }

    loop()
  }

  count (cb) {
    if (this._hook) cb = wrapHook(this, cb)

    this._get((err, cursor) => {
      if (err) { return cb(err) }
      cursor.count(false, this.opts, cb)
    })
  }

  size (cb) {
    if (this._hook) cb = wrapHook(this, cb)

    this._get((err, cursor) => {
      if (err) { return cb(err) }
      cursor.count(true, this.opts, cb)
    })
  }

  explain (cb) {
    if (this._hook) cb = wrapHook(this, cb)

    this._get((err, cursor) => {
      if (err) { return cb(err) }
      cursor.explain(cb)
    })
  }

  destroy () {
    const done = (err) => {
      if (err) { this.emit('error', err) }
      destroy(this)
    }

    this._get((err, cursor) => {
      if (err) return done(err)
      if (cursor.close) {
        cursor.close(done)
      }
    })
  }

  _read () {
    this.next((err, data) => {
      if (err) return this.emit('error', err)
      this.push(data)
    })
  }
}

// Missing mongodb cursor methods are addOption, hasNext, itcount, readPref, showDiskLoc
const opts = ['batchSize', 'hint', 'limit', 'maxTimeMS', 'max', 'min', 'skip', 'snapshot', 'sort']

opts.forEach((opt) => {
  Cursor.prototype[opt] = function (obj, cb) {
    this._opts[opt] = obj
    if (cb) return this.toArray(cb)
    return this
  }
})

module.exports = Cursor

function destroy (self) {
  if (self._destroyed) return
  self._destroyed = true
  if (self._hook) self._hook.emitDestroy()
}

function runInAsyncScope (self, cb, err, val) {
  if (self._hook.runInAsyncScope) {
    self._hook.runInAsyncScope(cb, null, err, val)
  } else {
    self._hook.emitBefore()
    cb(err, val)
    self._hook.emitAfter()
  }
}

function wrapHook (self, cb) {
  return function (err, val) {
    runInAsyncScope(self, cb, err, val)
  }
}
