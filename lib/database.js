const Collection = require('./collection')
const mongodb = require('mongodb')
const thunky = require('thunky')
const parse = require('parse-mongo-url')
const util = require('util')
const EventEmitter = require('events').EventEmitter

const noop = function () {}

const Database = function (connString, cols, options) {
  options = options || {}
  options.useNewUrlParser = options.useNewUrlParser === undefined ? true : options.useNewUrlParser
  options.useUnifiedTopology = options.useUnifiedTopology === undefined ? true : options.useUnifiedTopology

  const self = this

  EventEmitter.call(this)

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
      mongodb.connect(connString, options, function (err, conn) {
        if (err) {
          self.emit('error', err) // It's safer to emit an error instead of rely on the cb to handle the error
          return cb(err)
        }

        self.emit('connect')
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

  cols = cols || []
  cols.forEach((colName) => {
    self[colName] = self.collection(colName)

    const parts = colName.split('.')

    const last = parts.pop()
    const parent = parts.reduce((parent, prefix) => {
      parent[prefix] = parent[prefix] || {}
      return parent[prefix]
    }, self)

    parent[last] = self.collection(colName)
  })
}

util.inherits(Database, EventEmitter)

Database.prototype.collection = function (colName) {
  return new Collection({ name: colName }, this._getConnection)
}

Database.prototype.close = function (force, cb) {
  if (typeof force === 'function') { return this.close(false, force) }

  const self = this

  cb = cb || noop
  this._getConnection((err, server, conn) => {
    if (err) return cb(err)

    conn.close(force)

    self.emit('close')
    cb()
  })
}

Database.prototype.runCommand = function (opts, cb) {
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

Database.prototype.listCollections = function (cb) {
  this._getConnection((err, connection) => {
    if (err) { return cb(err) }

    connection.listCollections().toArray((err, collections) => {
      if (err) { return cb(err) }
      cb(null, collections)
    })
  })
}

Database.prototype.getCollectionNames = function (cb) {
  this.listCollections((err, collections) => {
    if (err) { return cb(err) }
    cb(null, collections.map((collection) => { return collection.name }))
  })
}

Database.prototype.createCollection = function (name, opts, cb) {
  if (typeof opts === 'function') return this.createCollection(name, {}, opts)

  const cmd = { create: name }
  Object.keys(opts).forEach((opt) => {
    cmd[opt] = opts[opt]
  })
  this.runCommand(cmd, cb)
}

Database.prototype.stats = function (scale, cb) {
  if (typeof scale === 'function') return this.stats(1, scale)
  this.runCommand({ dbStats: 1, scale: scale }, cb)
}

Database.prototype.dropDatabase = function (cb) {
  this.runCommand('dropDatabase', cb)
}

Database.prototype.createUser = function (usr, cb) {
  const cloned = Object.assign({}, usr)
  const username = cloned.user
  delete cloned.user

  const cmd = Object.assign({ createUser: username }, cloned)

  this.runCommand(cmd, cb)
}
Database.prototype.addUser = Database.prototype.createUser

Database.prototype.dropUser = function (username, cb) {
  this.runCommand({ dropUser: username }, cb)
}
Database.prototype.removeUser = Database.prototype.dropUser

Database.prototype.eval = function (fn) {
  const cb = arguments[arguments.length - 1]
  this.runCommand({
    eval: fn.toString(),
    args: Array.prototype.slice.call(arguments, 1, arguments.length - 1)
  }, (err, res) => {
    if (err) return cb(err)
    cb(null, res.retval)
  })
}

Database.prototype.getLastErrorObj = function (cb) {
  this.runCommand('getLastError', cb)
}

Database.prototype.getLastError = function (cb) {
  this.runCommand('getLastError', (err, res) => {
    if (err) return cb(err)
    cb(null, res.err)
  })
}

Database.prototype.toString = function () {
  return this._dbname
}

module.exports = Database
