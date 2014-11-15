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

  var cursor = new Cursor({
    query: query, 
    projection: projection, 
    onserver: this._getServer, 
    fullCollectionName: this._fullColName()
  });

  if (cb) return cursor.toArray(cb);
  return cursor;
};

Collection.prototype.findOne = function(query, projection, cb) {
  if (typeof query === 'function') return this.findOne({}, null, query);
  if (typeof projection === 'function') return this.findOne(query, null, projection);
  this.find(query, projection, function(err, docs) {
    if (err) return cb(err);
    cb(null, docs[0])
  });
};

Collection.prototype.count = function(query, cb) {
  if (typeof query === 'function') return this.count({}, query);
  this.find(query).count(cb);
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

Collection.prototype.runCommand = function(cmd, opts, cb) {
  if (typeof opts === 'function') return this.runCommand(cmd, null, opts);
  var self = this;
  opts = opts || {};

  var cmdObject = {};
  cmdObject[cmd] = this._name;
  Object.keys(opts).forEach(function(key) {
    cmdObject[key] = opts[key];
  });
  this._getServer(function(err, server) {
    if (err) return cb(err);
    server.command(self._dbname + '.$cmd', cmdObject, function(err, result) {
      if (err) return cb(err);
      cb(null, result.result);
    });
  });
};

module.exports = Collection;
