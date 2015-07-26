var mongodb = require('mongodb-core')
var xtend = require('xtend')

var Server = mongodb.Server
var ReplSet = mongodb.ReplSet

module.exports = function (config, options) {
  if (config.servers.length === 1) {
    var opts = xtend(config.server_options, options)
    opts.host = config.servers[0].host || 'localhost'
    opts.port = config.servers[0].port || 27017
    opts.reconnect = true
    opts.reconnectInterval = 50
    return new Server(opts)
  } else {
    var rsopts = xtend(config.rs_options, options)
    rsopts.setName = rsopts.rs_name
    rsopts.reconnect = true
    rsopts.reconnectInterval = 50
    return new ReplSet(config.servers, rsopts)
  }
}
