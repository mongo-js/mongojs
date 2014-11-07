var util = require('util');
var pump = require('pump');
var concat = require('concat-stream');
var Readable = require('stream').Readable || require('readable-stream');

var noop = function() {};

var getCallback = function(args) {
  var callback = args[args.length-1];
  return typeof callback === 'function' ? callback : noop;
};

var Cursor = function(oncursor) {
  Readable.call(this, {objectMode:true, highWaterMark:0});
  this._get = oncursor;
};

util.inherits(Cursor, Readable);

Cursor.prototype.next = function(cb) {
  return this._apply('next', arguments);
};

Cursor.prototype.toArray = function(cb) {
  var array = [];
  var self = this;

  var loop = function() {
    self.next(function(err, obj) {
      if (err) return cb(err);
      if (!obj) return cb(null, array);
      array.push(obj);
      loop();
    });
  };

  loop();
};

Cursor.prototype._read = function() {
  var self = this;
  this.next(function(err, data) {
    if (err) return self.emit('error', err);
    self.push(data);
  });
};

Cursor.prototype._apply = function(fn, args) {
  this._get(function(err, cursor) {
    if (err) return getCallback(args)(err);
    cursor[fn].apply(cursor, args);
  });

  return this;
};

module.exports = Cursor;
