var Collection = require('./collection')
var mongodb = require('mongodb')
var xtend = require('xtend')
var thunky = require('thunky')
var parse = require('parse-mongo-url')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var promisify = require('./promisify')

var noop = promisify.noop

var Database = function (connString, cols, options) {
  var self = this

  EventEmitter.call(this)

  if (typeof connString === 'string') {
    this._dbname = parse(connString).dbName

    // Fix short cut connection URLs consisting only of a db name or db + host
    if (connString.indexOf('/') < 0) {
      connString = 'localhost/' + connString
    }

    if (connString.indexOf('mongodb://') < 0) {
      connString = 'mongodb://' + connString
    }

    this._getConnection = thunky(function (cb) {
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

    this._getConnection = thunky(function (cb) {
      cb(null, connString)
    })
  }

  this.ObjectId = mongodb.ObjectId

  cols = cols || []
  cols.forEach(function (colName) {
    self[colName] = self.collection(colName)

    var parts = colName.split('.')

    var last = parts.pop()
    var parent = parts.reduce(function (parent, prefix) {
      parent[prefix] = parent[prefix] || {}
      return parent[prefix]
    }, self)

    parent[last] = self.collection(colName)
  })
}

util.inherits(Database, EventEmitter)

Database.prototype.collection = function (colName) {
  return new Collection({name: colName}, this._getConnection)
}

Database.prototype.close = function (force, cb) {
  if (typeof force === 'function') { return this.close(false, force) }

  var self = this

  cb = cb || noop
  return promisify((cb) => {
    this._getConnection(function (err, server, conn) {
      if (err) return cb(err)

      conn.close(force)

      self.emit('close')
      cb()
    })
  }, cb)
}

Database.prototype.runCommand = function (opts, cb) {
  cb = cb || noop
  if (typeof opts === 'string') {
    var tmp = opts
    opts = {}
    opts[tmp] = 1
  }

  return promisify((cb) => {
    this._getConnection(function (err, connection) {
      if (err) return cb(err)
      connection.command(opts, function (err, result) {
        if (err) return cb(err)
        cb(null, result)
      })
    })
  }, cb)
}

Database.prototype.listCollections = function (cb) {
  return promisify((cb) => {
    this._getConnection(function (err, connection) {
      if (err) { return cb(err) }

      connection.listCollections().toArray(function (err, collections) {
        if (err) { return cb(err) }
        cb(null, collections)
      })
    })
  }, cb)
}

Database.prototype.getCollectionNames = function (cb) {
  this.listCollections(function (err, collections) {
    if (err) { return cb(err) }
    cb(null, collections.map(function (collection) { return collection.name }))
  })
}

Database.prototype.createCollection = function (name, opts, cb) {
  if (typeof opts === 'function') return this.createCollection(name, {}, opts)

  var cmd = {create: name}
  Object.keys(opts).forEach(function (opt) {
    cmd[opt] = opts[opt]
  })
  return this.runCommand(cmd, cb)
}

Database.prototype.stats = function (scale, cb) {
  if (typeof scale === 'function') return this.stats(1, scale)
  return this.runCommand({dbStats: 1, scale: scale}, cb)
}

Database.prototype.dropDatabase = function (cb) {
  return this.runCommand('dropDatabase', cb)
}

Database.prototype.createUser = function (usr, cb) {
  var cmd = xtend({createUser: usr.user}, usr)
  delete cmd.user
  return this.runCommand(cmd, cb)
}
Database.prototype.addUser = Database.prototype.createUser

Database.prototype.dropUser = function (username, cb) {
  return this.runCommand({dropUser: username}, cb)
}
Database.prototype.removeUser = Database.prototype.dropUser

Database.prototype.eval = function (fn) {
  var cb = arguments[arguments.length - 1]
  return this.runCommand({
    eval: fn.toString(),
    args: Array.prototype.slice.call(arguments, 1, arguments.length - 1)
  }, function (err, res) {
    if (err) return cb(err)
    cb(null, res.retval)
  })
}

Database.prototype.getLastErrorObj = function (cb) {
  return this.runCommand('getLastError', cb)
}

Database.prototype.getLastError = function (cb) {
  return this.runCommand('getLastError', function (err, res) {
    if (err) return cb(err)
    cb(null, res.err)
  })
}

Database.prototype.toString = function () {
  return this._dbname
}

module.exports = Database
