var Collection = require('./collection')
var mongodb = require('mongodb')
var xtend = require('xtend')
var thunky = require('thunky')
// var parse = require('parse-mongo-url')

var noop = function () {}

var Database = function (connString, cols, options) {
  var self = this

  // TODO: Cleanup theses options - including xtend stuff in index.js
  if (typeof connString === 'string') {
    if (connString.indexOf('mongodb://') < 0) {
      // TODO: Fix - protocol, host and port should come from but should be 'added' in case they are missing
      connString = 'mongodb://localhost:27017/' + connString
    }

    this._getConnection = thunky(function (cb) {
      mongodb.connect(connString, options, cb)
    })
  } else {
    var connection = connString

    // TODO: Check if the connection we got is already connected and connect if not!
    this._getConnection = thunky(function (cb) {
      cb(null, connection)
    })
  }

  this.ObjectId = mongodb.ObjectId

  // TODO: Should we leave this to mongodb?
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

// TODO: Fix event handling
Database.prototype.on = function (event, handler) {
  this._server.on(event, handler)
  return this
}

Database.prototype.collection = function (colName) {
  return new Collection({name: colName}, this._getConnection)
}

Database.prototype.close = function (force, cb) {
  if (typeof force == 'function') { return this.close(false, force) }

  cb = cb || noop
  this._getConnection(function (err, server) {
    if (err) return cb(err)

    server.close(force)
    cb()
  })
}

Database.prototype.runCommand = function (opts, cb) {
  cb = cb || noop
  if (typeof opts === 'string') {
    var tmp = opts
    opts = {}
    opts[tmp] = 1
  }

  this._getConnection(function (err, connection) {
    if (err) return cb(err)
    connection.command(opts, function (err, result) {
      if (err) return cb(err)
      cb(null, result)
    })
  })
}

Database.prototype.getCollectionNames = function (cb) {
  this.collection('system.namespaces').find({name: /^((?!\$).)*$/}, function (err, cols) {
    if (err) return cb(err)
    cb(null, cols.map(function (col) {
      return col.name.split('.').splice(1).join('.')
    }))
  })
}

Database.prototype.createCollection = function (name, opts, cb) {
  if (typeof opts === 'function') return this.createCollection(name, {}, opts)

  var cmd = {create: name}
  Object.keys(opts).forEach(function (opt) {
    cmd[opt] = opts[opt]
  })
  this.runCommand(cmd, cb)
}

Database.prototype.stats = function (scale, cb) {
  if (typeof scale === 'function') return this.stats(1, scale)
  this.runCommand({dbStats: 1, scale: scale}, cb)
}

Database.prototype.dropDatabase = function (cb) {
  this.runCommand('dropDatabase', cb)
}

Database.prototype.createUser = function (usr, cb) {
  var cmd = xtend({createUser: usr.user}, usr)
  delete cmd.user
  this.runCommand(cmd, cb)
}
Database.prototype.addUser = Database.prototype.createUser

Database.prototype.dropUser = function (username, cb) {
  this.runCommand({dropUser: username}, cb)
}
Database.prototype.removeUser = Database.prototype.dropUser

Database.prototype.eval = function (fn) {
  var cb = arguments[arguments.length - 1]
  this.runCommand({
    eval: fn.toString(),
    args: Array.prototype.slice.call(arguments, 1, arguments.length - 1)
  }, function (err, res) {
    if (err) return cb(err)
    cb(null, res.retval)
  })
}

Database.prototype.getLastErrorObj = function (cb) {
  this.runCommand('getLastError', cb)
}

Database.prototype.getLastError = function (cb) {
  this.runCommand('getLastError', function (err, res) {
    if (err) return cb(err)
    cb(null, res.err)
  })
}

Database.prototype.toString = function () {
  return this._dbname
}

module.exports = Database
