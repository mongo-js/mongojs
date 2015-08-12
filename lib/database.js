var Collection = require('./collection')
var bson = require('mongodb-core').BSON
var xtend = require('xtend')
var thunky = require('thunky')
var toMongodbCore = require('to-mongodb-core')
var parse = require('parse-mongo-url')
var getTopology = require('./get-topology')
var connect = require('./connect')

var noop = function () {}

var Database = function (options) {
  var self = this

  if (typeof options.connString === 'string') {
    var config = parse(options.connString)

    this._dbname = config.dbName
    this._server = getTopology(config, options)

    this._getServer = thunky(function (cb) {
      connect(self._server, config, options, cb)
    })
  } else {
    this._dbname = options.connString._dbname
    this._server = options.connString

    this._getServer = thunky(function (cb) {
      toMongodbCore(options.connString, function (err, server) {
        if (err) return cb(new Error('You must pass a connection string or a mongojs instance.'))
        cb(null, server)
      })
    })
  }

  this.ObjectId = bson.ObjectId
  options.cols = options.cols || []
  options.cols.forEach(function (colName) {
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

Database.prototype.on = function (event, handler) {
  this._server.on(event, handler)
  return this
}

Database.prototype.collection = function (colName) {
  return new Collection({name: colName, dbname: this._dbname}, this._getServer)
}

Database.prototype.close = function (cb) {
  cb = cb || noop
  this._getServer(function (err, server) {
    if (err) return cb(err)
    server.destroy(true, true)
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

  var self = this
  this._getServer(function (err, server) {
    if (err) return cb(err)
    server.command(self._dbname + '.$cmd', opts, function (err, result) {
      if (err) return cb(err)
      cb(null, result.result)
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
