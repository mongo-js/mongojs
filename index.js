var mongodb = require('mongodb-core');
var thunky = require('thunky');
var url = require('url');
var once = require('once');
var toMongodbCore = require('to-mongodb-core');

var Database = require('./lib/database');

var Server = mongodb.Server;

var parseConfig = function(cs) {
  //if (typeof cs !== 'string') throw new Error('connection string required'); // to avoid undef errors on bad conf
  if (typeof cs !== 'string') return null;
  cs = cs.replace(/^\//, '');

  if (cs.indexOf('/') < 0) return parseConfig('127.0.0.1/'+cs);
  if (cs.indexOf('mongodb://') !== 0) return parseConfig('mongodb://'+cs);

  return url.parse(cs);
};

module.exports = function(connString, cols) {
  var connInfo = parseConfig(connString);
  var dbname = connInfo && connInfo.pathname && connInfo.pathname.substr(1);
  var onserver = thunky(function(cb) {
    cb = once(cb);
    var srv = new Server({
      host: connInfo.hostname || 'localhost',
      port: connInfo.port || 27017,
      reconnect: true,
      reconnectInterval: 50
    });

    srv.on('connect', function(server) {
      cb(null, server);
    });

    srv.on('error', function(err) {
      cb(err);
    });

    srv.connect();
  });

  if (!connInfo) {
    dbname = connString._dbname;
    onserver = thunky(function(cb) {
      toMongodbCore(connString, function(err, server) {
        if (err) cb(new Error('You must pass a connection string or a mongojs instance.'));
        cb(null, server);
      });
    });
  }

  var that = new Database({name: dbname, cols: cols}, onserver);
  if (typeof Proxy !== 'undefined') {
    var p = Proxy.create({
      get: function(obj, prop) {
        if (that[prop]) return that[prop];
        that[prop] = that.collection(prop);
        return that[prop];
      }
    });

    return p;
  };
  return that;
};
