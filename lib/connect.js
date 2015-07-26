var mongodb = require('mongodb-core')

var authMechanisms = {
  MongoCR: mongodb.MongoCR,
  ScramSHA1: mongodb.ScramSHA1
}

module.exports = function connect (srv, config, options, cb) {
  var authMechanism = 'MongoCR'
  if (options && options.authMechanism) {
    if (!authMechanisms[options.authMechanism]) {
      return cb(new Error(options.authMechanism + ' is not a supported authentication mechanism'))
    }

    authMechanism = options.authMechanism
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
