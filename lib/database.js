var Collection = require('./collection');

var noop = function() {};

var Database = function(opts, onserver) {
  this._getServer = onserver;
  this._dbname = opts.name;
  
  var self = this;
  opts.cols = opts.cols || [];
  opts.cols.forEach(function(colName) {
    self[colName] = self.collection(colName);
  });
};

Database.prototype.collection = function(colName) {
  return new Collection({name: colName, dbname: this._dbname}, this._getServer);
};

Database.prototype.close = function(cb) {
  cb = cb || noop;
  this._getServer(function(err, server) {
    if (err) return cb(err);
    server.destroy();
    cb();
  });
};

Database.prototype.runCommand = function(opts, cb) {
  cb = cb || noop;
  if (typeof opts === 'string') {
    var tmp = opts;
    opts = {};
    opts[tmp] = 1;
  }

  var self = this;
  this._getServer(function(err, server) {
    if (err) return cb(err);
    server.command(self._dbname + '.$cmd', opts, function(err, result) {
      if (err) return cb(err);
      cb(null, result.result);
    });
  });
};

Database.prototype.getCollectionNames = function(cb) {
  this.collection('system.namespaces').find({name:/^((?!\$).)*$/}, function(err, cols) {
    if (err) return cb(err);
    cb(null, cols.map(function(col) {
      return col.name.split('.').splice(1).join('.');
    }));
  });
};

Database.prototype.createCollection = function(name, opts, cb) {
  if (typeof opts === 'function') return this.createCollection(name, {}, opts);

  var cmd = {create: name};
  Object.keys(opts).forEach(function(opt) {
    cmd[opt] = opts[opt];
  });
  this.runCommand(cmd, cb);
};

module.exports = Database;
