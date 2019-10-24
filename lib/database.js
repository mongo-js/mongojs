const Collection = require('./collection')
const mongodb = require('mongodb')
const thunky = require('thunky')
const parse = require('parse-mongo-url')
const { EventEmitter } = require('events')

const noop = function () {}

class Database extends EventEmitter {
  constructor (connString, cols, options) {
    super()

    options = options || {}
    options.useNewUrlParser = options.useNewUrlParser === undefined ? true : options.useNewUrlParser
    options.useUnifiedTopology = options.useUnifiedTopology === undefined ? true : options.useUnifiedTopology

    this._writeOpts = options.writeOpts || { writeConcern: { w: 1 }, ordered: true }
    delete options.writeOpts

    if (typeof connString === 'string') {
      this._dbname = parse(connString).dbName

      // Fix short cut connection URLs consisting only of a db name or db + host
      if (connString.indexOf('/') < 0) {
        connString = 'localhost/' + connString
      }

      if (connString.indexOf('mongodb://') < 0 && connString.indexOf('mongodb+srv://') < 0) {
        connString = 'mongodb://' + connString
      }

      this._connString = connString

      this._getConnection = thunky((cb) => {
        mongodb.connect(connString, options, (err, conn) => {
          if (err) {
            this.emit('error', err) // It's safer to emit an error instead of rely on the cb to handle the error
            return cb(err)
          }

          this.emit('connect')
          cb(null, conn.db(this._dbname), conn)
        })
      })
    } else if (typeof connString._getConnection === 'function') { // mongojs
      this._dbname = connString._dbname
      this._getConnection = connString._getConnection
    } else { // try mongodb-native
      if (connString.options.url) {
        this._dbname = parse(connString.options.url).dbName
      } else {
        this._dbname = connString.databaseName // Try fallback for some mongodb native versions
      }

      this._getConnection = thunky((cb) => {
        cb(null, connString)
      })
    }

    this.ObjectId = mongodb.ObjectId

    if (Array.isArray(cols)) {
      const colsObj = {}

      for (const col of cols) {
        colsObj[col] = col
      }

      cols = colsObj
    }

    cols = cols || {}

    Object.keys(cols).forEach((colName) => {
      this[colName] = this.collection(cols[colName])

      const parts = cols[colName].split('.')

      const last = parts.pop()
      const parent = parts.reduce((parent, prefix) => {
        parent[prefix] = parent[prefix] || {}
        return parent[prefix]
      }, this)

      parent[last] = this.collection(cols[colName])
    })
  }

  collection (colName) {
    return new Collection(Object.assign({ name: colName }, { writeOpts: this._writeOpts }), this._getConnection)
  }

  close (force, cb) {
    if (typeof force === 'function') { return this.close(false, force) }

    cb = cb || noop
    this._getConnection((err, server, conn) => {
      if (err) return cb(err)

      conn.close(force)

      this.emit('close')
      cb()
    })
  }

  runCommand (opts, cb) {
    cb = cb || noop
    if (typeof opts === 'string') {
      const tmp = opts
      opts = {}
      opts[tmp] = 1
    }

    this._getConnection((err, connection) => {
      if (err) return cb(err)
      connection.command(opts, (err, result) => {
        if (err) return cb(err)
        cb(null, result)
      })
    })
  }

  listCollections (cb) {
    this._getConnection((err, connection) => {
      if (err) { return cb(err) }

      connection.listCollections().toArray((err, collections) => {
        if (err) { return cb(err) }
        cb(null, collections)
      })
    })
  }

  getCollectionNames (cb) {
    this.listCollections((err, collections) => {
      if (err) { return cb(err) }
      cb(null, collections.map((collection) => { return collection.name }))
    })
  }

  createCollection (name, opts, cb) {
    if (typeof opts === 'function') return this.createCollection(name, {}, opts)

    const cmd = { create: name }
    Object.keys(opts).forEach((opt) => {
      cmd[opt] = opts[opt]
    })
    this.runCommand(cmd, cb)
  }

  stats (scale, cb) {
    if (typeof scale === 'function') return this.stats(1, scale)
    this.runCommand({ dbStats: 1, scale: scale }, cb)
  }

  dropDatabase (cb) {
    this.runCommand('dropDatabase', cb)
  }

  createUser (usr, cb) {
    const cloned = Object.assign({}, usr)
    const username = cloned.user
    delete cloned.user

    const cmd = Object.assign({ createUser: username }, cloned)

    this.runCommand(cmd, cb)
  }

  dropUser (username, cb) {
    this.runCommand({ dropUser: username }, cb)
  }

  eval (fn) {
    const cb = arguments[arguments.length - 1]
    this.runCommand({
      eval: fn.toString(),
      args: Array.prototype.slice.call(arguments, 1, arguments.length - 1)
    }, (err, res) => {
      if (err) return cb(err)
      cb(null, res.retval)
    })
  }

  getLastErrorObj (cb) {
    this.runCommand('getLastError', cb)
  }

  getLastError (cb) {
    this.runCommand('getLastError', (err, res) => {
      if (err) return cb(err)
      cb(null, res.err)
    })
  }

  toString () {
    return this._dbname
  }
}

Database.prototype.addUser = Database.prototype.createUser
Database.prototype.removeUser = Database.prototype.dropUser

module.exports = Database
