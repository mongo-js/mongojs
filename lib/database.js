var Collection = require('./collection');

var Database = function(opts, onserver) {
  this._getServer = onserver;
  this._dbname = opts.name;
  
  var self = this;
  opts.cols.forEach(function(colName) {
    self[colName] = self.collection(colName);
  });
};

Database.prototype.collection = function(colName) {
  return new Collection({name: colName, dbname: this._dbname}, this._getServer);
};

Database.prototype.close = function(cb) {
  this._getServer(function(err, server) {
    if (err) return cb(err);
    server.destroy();
    cb();
  });
};

module.exports = Database;
