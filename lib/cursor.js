var util = require('util')
var thunky = require('thunky')
var Readable = require('readable-stream').Readable

var Cursor = function (getCursor) {
  Readable.call(this, {objectMode: true, highWaterMark: 0})

  this._opts = {}

  var self = this
  this._get = thunky(function (cb) {
    getCursor(function (err, cursor) {
      if (err) { return cb(err) }

      // Apply all opts
      for (var key in self._opts) {
        if (self._opts.hasOwnProperty(key)) {
          cursor = cursor[key].call(cursor, self._opts[key])
        }
      }

      cb(null, cursor)
    })
  })
}

util.inherits(Cursor, Readable)

Cursor.prototype.next = function (cb) {
  this._get(function (err, cursor) {
    if (err) return cb(err)
    cursor.next(cb)
  })

  return this
}

Cursor.prototype.rewind = function (cb) {
  this._get(function (err, cursor) {
    if (err) return cb(err)
    cursor.rewind(cb)
  })

  return this
}

Cursor.prototype.toArray = function (cb) {
  var array = []
  var self = this

  var loop = function () {
    self.next(function (err, obj) {
      if (err) return cb(err)
      if (!obj) return cb(null, array)
      array.push(obj)
      loop()
    })
  }

  loop()
}

Cursor.prototype.map = function (mapfn, cb) {
  var array = []
  var self = this

  var loop = function () {
    self.next(function (err, obj) {
      if (err) return cb(err)
      if (!obj) return cb(null, array)
      array.push(mapfn(obj))
      loop()
    })
  }

  loop()
}

Cursor.prototype.forEach = function (fn) {
  var self = this

  var loop = function () {
    self.next(function (err, obj) {
      if (err) return fn(err)
      fn(err, obj)

      if (!obj) return
      loop()
    })
  }

  loop()
}

Cursor.prototype.limit = function (n, cb) {
  this._opts.limit = n
  if (cb) return this.toArray(cb)
  return this
}

Cursor.prototype.skip = function (n, cb) {
  this._opts.skip = n
  if (cb) return this.toArray(cb)
  return this
}

Cursor.prototype.batchSize = function (n, cb) {
  this._opts.batchSize = n
  if (cb) return this.toArray(cb)
  return this
}

Cursor.prototype.sort = function (sortObj, cb) {
  this._opts.sort = sortObj
  if (cb) return this.toArray(cb)
  return this
}

Cursor.prototype.count = function (cb) {
  var self = this

  this._get(function(err, cursor) {
    if (err) { return cb(err) }
    cursor.count(true, self.opts, cb)
  })
}

Cursor.prototype.size = function (cb) {
  var self = this

  this._get(function(err, cursor) {
    if (err) { return cb(err) }
    cursor.count(false, self.opts, cb)
  })
}

Cursor.prototype.explain = function (cb) {
  this._get(function (err, cursor) {
    cursor.explain(cb)
  })
}

Cursor.prototype.destroy = function () {
  var self = this
  this._get(function (err, cursor) {
    if (err) return self.emit('error', err)
    if (cursor.kill) cursor.kill()
  })
}

Cursor.prototype._read = function () {
  var self = this
  this.next(function (err, data) {
    if (err) return self.emit('error', err)
    self.push(data)
  })
}

module.exports = Cursor
