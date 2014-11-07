var mongodb = require('mongodb-core');
var thunky = require('thunky');
var concat = require('concat-stream');
var pump = require('pump');

var Cursor = require('./cursor');

var writeOpts = {writeConcern: {w:1}, ordered:true};
var noop = function() {};
var oid = mongodb.BSON.ObjectID.createPk;

var Collection = function(opts, getServer) {
  this._name = opts.name;
  this._dbname = opts.dbname;
  this._getServer = getServer;
};

Collection.prototype._fullColName = function() {
  return this._dbname + '.' + this._name
};

Collection.prototype.find = function(query, projection, cb) {
  if (typeof query === 'function') return this.find({}, null, query);
  if (typeof projection === 'function') return this.find(query, null, projection);
  var self = this;
  var oncursor = thunky(function(cb) {
    self._getServer(function(err, server) {
      if (err) return cb(err);
      cb(null, server.cursor(self._fullColName(), {
        find: self._fullColName(),
        query: query,
        fields: projection
      }));
    });
  });

  var cursor = new Cursor(oncursor);
  if (cb) return pump(cursor, concat(function(array) {
    cb(null, array);
  }), function(err) {
    if (err) cb(err);
  });

  return cursor;
};

Collection.prototype.insert = function(docOrDocs, cb) {
  cb = cb || noop;
  var self = this;
  this._getServer(function(err, server) {
    if (err) return cb(err);

    var docs = Array.isArray(docOrDocs) ? docOrDocs: [docOrDocs];
    for (var i = 0; i < docs.length; i++) {
      if (!docs[i]._id) docs[i]._id = oid();
    }
    server.insert(self._fullColName(), docs, writeOpts, function(err, res) {
      if (err) return cb(err);
      cb(null, docOrDocs);
    });
  });
};

Collection.prototype.remove = function(query, justOne, cb) {
  if (typeof query === 'function') return this.remove({}, false, query);
  if (typeof justOne === 'function') return this.remove(query, false, justOne);

  var self = this;
  this._getServer(function(err, server) {
    if (err) return cb(err);
    server.remove(self._fullColName(), [{q: query, limit: justOne ? 1 : 0}], writeOpts, function(err, res) {
      if (err) return cb(err);
      cb(null, res.result)
    });
  });
};

module.exports = Collection;
