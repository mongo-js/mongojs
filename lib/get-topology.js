var once = require('once')
var parse = require('parse-mongo-url')
var mongodb = require('mongodb-core')

var Server = mongodb.Server
var ReplSet = mongodb.ReplSet

var authMechanisms = {
  MongoCR: mongodb.MongoCR,
  ScramSHA1: mongodb.ScramSHA1
}

module.exports = function (connString, options, cb) {
  cb = once(cb)
  var config = parse(connString)
  var srv

  var authMechanism = 'MongoCR'
  if (options && options.authMechanism) {
    if (!authMechanisms[options.authMechanism]) {
      return cb(new Error(options.authMechanism + ' is not a supported authentication mechanism'))
    }

    authMechanism = options.authMechanism
  }

  if (config.servers.length === 1) {
    var opts = config.server_options
    opts.host = config.servers[0].host || 'localhost'
    opts.port = config.servers[0].port || 27017
    opts.reconnect = true
    opts.reconnectInterval = 50
    srv = new Server(opts)
  } else {
    var rsopts = config.rs_options
    rsopts.setName = rsopts.rs_name
    rsopts.reconnect = true
    rsopts.reconnectInterval = 50
    srv = new ReplSet(config.servers, rsopts)
  }

  if (config.auth) {
    srv.addAuthProvider(authMechanism, new authMechanisms[authMechanism]())
    srv.on('connect', function (server) {
      server.auth(authMechanism, config.dbName, config.auth.user, config.auth.password, function (err, r) {
        if (err) return cb(err)
        cb(null, r)
      })
    })
  } else {
    srv.on('connect', function (server) {
      cb(null, server)
    })
  }

  srv.on('error', function (err) {
    cb(err)
  })

  srv.connect()
}
