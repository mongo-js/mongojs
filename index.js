var mongodb = require('mongodb');
var thunky = require('thunky');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Readable = require('stream').Readable || require('readable-stream');
var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;

var DriverCollection = mongodb.Collection.prototype;
var DriverDb = mongodb.Db.prototype;

var noop = function() {};

var ensureCallback = function(args) {
  if (getCallback(args) !== noop) return args;
  args = Array.prototype.slice.call(args);
  args.push(noop);
  return args;
};

var replaceCallback = function(args, fn) {
  args = ensureCallback(args);
  args[args.length - 1] = fn;

  return args;
};

var getCallback = function(args) {
  var callback = args[args.length-1];
  return typeof callback === 'function' ? callback : noop;
};

// Proxy for the native cursor prototype that normalizes method names and
// arguments to fit the mongo shell.

var Cursor = function(oncursor) {
  Readable.call(this, {objectMode:true, highWaterMark:0});
  this._get = oncursor;
};

util.inherits(Cursor, Readable);

Cursor.prototype.toArray = function() {
  this._apply('toArray', arguments);
};

Cursor.prototype.next = function() {
  this._apply('nextObject', arguments);
};

Cursor.prototype.forEach = function() {
  this._apply('each', arguments);
};

Cursor.prototype.count = function() {
  this._apply('count', arguments);
};

Cursor.prototype.explain = function() {
  this._apply('explain', arguments);
};

Cursor.prototype.limit = function() {
  return this._config('limit', arguments);
};

Cursor.prototype.skip = function() {
  return this._config('skip', arguments);
};

Cursor.prototype.batchSize = function() {
  return this._config('batchSize', arguments);
};

Cursor.prototype.sort = function() {
  return this._config('sort', arguments);
};

Cursor.prototype.rewind = function() {
  return this._config('rewind', arguments);
};

Cursor.prototype.readPref = function() {
  return this._config('setReadPreference', arguments);
};

Cursor.prototype.destroy = function() {
  this._apply('close', arguments);
  this.push(null);
};

Cursor.prototype.map = function(mapfn, callback) {
  this.toArray(function(err, arr) {
    if (err) return callback(err);
    callback(null, arr.map(mapfn));
  });
};

Cursor.prototype.size = function(callback) {
  this.count(true, callback);
};

Cursor.prototype._apply = function(fn, args) {
  this._get(function(err, cursor) {
    if (err) return getCallback(args)(err);
    cursor[fn].apply(cursor, args);
  });

  return this;
};

Cursor.prototype._read = function() { // 0.10 stream support (0.8 compat using readable-stream)
  var self = this;
  this.next(function(err, data) {
    if (err) return self.emit('error', err);
    self.push(data);
  });
};

Cursor.prototype._config = function(fn, args) {
  if (typeof args[args.length-1] !== 'function') return this._apply(fn, args);

  args = Array.prototype.slice.call(args);
  var callback = args.pop();
  return this._apply(fn, args).toArray(callback);
};

var BulkFind = function(onbulkfind) {
  this._get = onbulkfind;
};

BulkFind.prototype._apply = function(fn, args) {
  this._get(function(err, bulkFind) {
    if (err) return getCallback(args)(err);
    bulkFind[fn].apply(bulkFind, args);
  });

  return this;
};

BulkFind.prototype.update = function() {
  return this._apply('update', arguments);
};

BulkFind.prototype.updateOne = function() {
  return this._apply('updateOne', arguments);
};

BulkFind.prototype.upsert = function() {
  return this._apply('upsert', arguments);
};

BulkFind.prototype.remove = function() {
  return this._apply('remove', arguments);
};

BulkFind.prototype.removeOne = function() {
  return this._apply('removeOne', arguments);
};

BulkFind.prototype.replaceOne = function() {
  return this._apply('replaceOne', arguments);
};

var Bulk = function(onbulk) {
  this._get = onbulk;
};

Bulk.prototype._apply = function(fn, args) {
  this._get(function(err, bulk) {
    if (err) return getCallback(args)(err);
    bulk[fn].apply(bulk, args);
  });

  return this;
};

Bulk.prototype.insert = function() {
  return this._apply('insert', arguments);
};

Bulk.prototype.execute = function() {
  return this._apply('execute', arguments);
};

Bulk.prototype.find = function() {
  var self = this;
  var args = arguments;
  var onbulkfind = thunky(function(callback) {
    self._get(function(err, bulk) {
      callback(err, bulk.find.apply(bulk, args))
    });
  });

  return new BulkFind(onbulkfind);
};

// Proxy for the native collection prototype that normalizes method names and
// arguments to fit the mongo shell.

var Collection = function(name, oncollection) {
  this._get = oncollection;
  this._name = name;
};

Collection.prototype.aggregate = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[args.length-1] === 'function') {
    return this._apply(DriverCollection.aggregate, ensureCallback(arguments));
  }
  args.push({cursor: {batchSize: 1}});

  var pt = new PassThrough({objectMode: true, highWaterMark: 16});
  this._get(function(err, collection) {
    if (err) return callback(err);
    collection.aggregate.apply(collection, args).pipe(pt);
  });

  return pt;
};

Collection.prototype.count = function() {
  return this._apply(DriverCollection.count, arguments);
};

Collection.prototype.createIndex = function() {
  return this._apply(DriverCollection.createIndex, ensureCallback(arguments));
};

Collection.prototype.distinct = function() {
  return this._apply(DriverCollection.distinct, arguments);
};

Collection.prototype.drop = function() {
  return this._apply(DriverCollection.drop, ensureCallback(arguments));
};

Collection.prototype.dropIndex = function() {
  return this._apply(DriverCollection.dropIndex, ensureCallback(arguments));
};

Collection.prototype.dropIndexes = function(callback) {
  this.runCommand('dropIndexes', {index: '*'}, callback);
};

Collection.prototype.ensureIndex = function() {
  return this._apply(DriverCollection.ensureIndex, ensureCallback(arguments));
};

Collection.prototype.isCapped = function() {
  return this._apply(DriverCollection.isCapped, arguments);
};

Collection.prototype.mapReduce = function() {
  return this._apply(DriverCollection.mapReduce, ensureCallback(arguments));
};

Collection.prototype.reIndex = function() {
  return this._apply(DriverCollection.reIndex, ensureCallback(arguments));
};

Collection.prototype.stats = function() {
  return this._apply(DriverCollection.stats, arguments);
};

Collection.prototype.find = function() {
  var args = Array.prototype.slice.call(arguments);

  var oncollection = this._get;
  var oncursor = thunky(function(callback) {
    args.push(callback);
    oncollection(function(err, collection) {
      if (err) return callback(err);
      collection.find.apply(collection, args);
    });
  });

  if (typeof args[args.length-1] === 'function') {
    var callback = args.pop();

    oncursor(function(err, cursor) {
      if (err) return callback(err);
      cursor.toArray(callback);
    });
  }

  return new Cursor(oncursor);
};

Collection.prototype.findOne = function() { // see http://www.mongodb.org/display/DOCS/Queries+and+Cursors
  var args = Array.prototype.slice.call(arguments);
  var callback = args.pop();

  this.find.apply(this, args).limit(1).next(callback);
};

Collection.prototype.findAndModify = function(options, callback) {
  this._apply(DriverCollection.findAndModify, [options.query, options.sort || [], options.update || {}, {
    new:!!options.new,
    remove:!!options.remove,
    upsert:!!options.upsert,
    fields:options.fields
  }, function(err, doc, obj) {
    // If the findAndModify command returns an error, obj is undefined and the lastErrorObject
    // property is added to the err argument instead.
    // If the findAndModify command finds no matching document, when performing update or remove,
    // no lastErrorObject is included (so we fake it).
    (callback || noop)(err, doc, (obj && obj.lastErrorObject) || { n: 0 });
  }]);
};

Collection.prototype.group = function(group, callback) {
  this._apply(DriverCollection.group, [
      group.key ? group.key : group.keyf, 
      group.cond, 
      group.initial, 
      group.reduce, 
      group.finalize, 
      true, 
      callback
  ]);
};

Collection.prototype.remove = function() {
  var self = this;
  var fn = getCallback(arguments);

  var callback = function(err, count) {
    if (err) return fn(err);
    fn(err, { n: count });
  };

  if (arguments.length > 1 && arguments[1] === true) { // the justOne parameter
    this.findOne(arguments[0], function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(null, {n : 0});
      self._apply(DriverCollection.remove, [doc, callback]);
    });
    return;
  }

  this._apply(DriverCollection.remove, arguments.length === 0 ? [{}, noop] : replaceCallback(arguments, callback));
};

Collection.prototype.insert = function() {
  var args = arguments;
  var fn = getCallback(arguments);

  var callback = function(err, docs) {
    if (err) return fn(err);
    if (Array.isArray(args[0])) {
      fn(err, docs, { n : 0});
    } else {
      fn(err, docs[0], { n : 0});
    }
  };
  this._apply(DriverCollection.insert, replaceCallback(arguments, callback));
};

Collection.prototype.save = function() {
  var self = this;
  var args = arguments;
  var fn = getCallback(arguments);

  var callback = function(err, doc, lastErrorObject) {
    if (err) return fn(err);
    if (doc === 1) {
      fn(err, args[0], lastErrorObject);
    } else {
      // The third parameter is a faked lastErrorObject
      fn(err, doc, { n : 0});
    }
  };
  this._apply(DriverCollection.save, replaceCallback(arguments, callback));
};

Collection.prototype.update = function() {
  var fn = getCallback(arguments);
  var callback = function(err, count, lastErrorObject) {
    fn(err, lastErrorObject);
  };

  this._apply(DriverCollection.update, replaceCallback(arguments, callback));
};

Collection.prototype.getIndexes = function() {
  this._apply(DriverCollection.indexes, arguments);
};

Collection.prototype.runCommand = function(cmd, opts, callback) {
  callback = callback || noop;
  opts = opts || {};
  if (typeof opts === 'function') {
    callback = opts;
  }
  this._get(function(err, collection) {
    if (err) return callback(err);
    var commandObject = {};
    commandObject[cmd] = collection.collectionName;
    Object.keys(opts).forEach(function(key) {
      commandObject[key] = opts[key];
    });
    collection.db.command(commandObject, callback);
  });
};

Collection.prototype.initializeUnorderedBulkOp = function() {
  return this._initializeBulkOp(false);
};

Collection.prototype.initializeOrderedBulkOp = function() {
  return this._initializeBulkOp(true);
};

Collection.prototype._initializeBulkOp = function(ordered) {
  var self = this;
  var onbulk = thunky(function(callback) {
    self._get(function(err, collection) {
      var fn = ordered ? collection.initializeOrderedBulkOp : collection.initializeUnorderedBulkOp;
      callback(err, fn.call(collection));
    })
  });

  return new Bulk(onbulk);
};

Collection.prototype.toString = function() {
  return this._name;
};

Collection.prototype._apply = function(fn, args) {
  this._get(function(err, collection) {
    if (err) return getCallback(args)(err);
    if (!collection.opts || getCallback(args) === noop) return fn.apply(collection, args);

    var safe = collection.opts.safe;
    collection.opts.safe = true;
    fn.apply(collection, args);
    collection.opts.safe = safe;
  });
};

var toConnectionString = function(conf) { // backwards compat config map (use a connection string instead)
  var options = [];
  var hosts = conf.replSet ? conf.replSet.members || conf.replSet : [conf];
  var auth = conf.username ? (conf.username+':'+conf.password+'@') : '';

  hosts = hosts.map(function(server) {
    if (typeof server === 'string') return server;
    return (server.host || '127.0.0.1') + ':' + (server.port || 27017);
  }).join(',');

  if (conf.slaveOk) options.push('slaveOk=true');

  return 'mongodb://'+auth+hosts+'/'+conf.db+'?'+options.join('&');
};

var parseConfig = function(cs) {
  if (typeof cs === 'object' && cs) return toConnectionString(cs);
  if (typeof cs !== 'string') throw new Error('connection string required'); // to avoid undef errors on bad conf
  cs = cs.replace(/^\//, '');

  if (cs.indexOf('/') < 0) return parseConfig('127.0.0.1/'+cs);
  if (cs.indexOf('mongodb://') !== 0) return parseConfig('mongodb://'+cs);

  return cs;
};

var Database = function(name, ondb) {
  EventEmitter.call(this);
  this._get = ondb;
  this._name = name;
  if (!this._name) {
    var self = this;
    this._get(function(err, db) {
      self._name = db.databaseName;
    });
  }
};

util.inherits(Database, EventEmitter);

Database.prototype.close = function() {
  return this._apply(DriverDb.close, ensureCallback(arguments));
};

Database.prototype.addUser = function() {
  return this._apply(DriverDb.addUser, ensureCallback(arguments));
};

Database.prototype.dropDatabase = function() {
  return this._apply(DriverDb.dropDatabase, ensureCallback(arguments));
};

Database.prototype.eval = function() {
  return this._apply(DriverDb.eval, ensureCallback(arguments));
};

Database.prototype.removeUser = function() {
  return this._apply(DriverDb.removeUser, ensureCallback(arguments));
};

Database.prototype.stats = function() {
  return this._apply(DriverDb.stats, arguments);
};

Database.prototype.runCommand = function(opts, callback) {
  callback = callback || noop;
  if (typeof opts === 'string') {
    var tmp = opts;
    opts = {};
    opts[tmp] = 1;
  }
  this._get(function(err, db) {
    if (err) return callback(err);
    if (opts.shutdown === undefined) return db.command(opts, callback);
    // If the command in question is a shutdown, mongojs should shut down the server without crashing.
    db.command(opts, function(err) {
      db.close();
      callback.apply(this, arguments);
    });
  });
};

Database.prototype.open = function(callback) {
  this._get(callback); // a way to force open the db, 99.9% of the times this is not needed
};

Database.prototype.getCollectionNames = function(callback) {
  this._get(function(err, db) {
    db.collections(function(err, cols) {
      if (err) return callback(err);
      callback(null, cols.map(function(c) {
        return c.collectionName;
      }));
    });
  });
};

Database.prototype.createCollection = function(name, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts = opts || {};
  opts.strict = opts.strict !== false;
  this._apply(DriverDb.createCollection, [name, opts, callback || noop]);
};

Database.prototype.collection = function(name) {
  var self = this;

  var oncollection = thunky(function(callback) {
    self._get(function(err, db) {
      if (err) return callback(err);
      db.collection(name, callback);
    });
  });

  return new Collection(this._name+'.'+name, oncollection);
};

Database.prototype.toString = function() {
  return this._name;
};

Database.prototype.getLastError = function (callback) {
  this.runCommand('getLastError', function(err, res) {
    if (err) return callback(err);
    callback(err, res.err);
  });
};

Database.prototype.getLastErrorObj = function (callback) {
  this.runCommand('getLastError', callback);
};

Database.prototype._apply = function(fn, args) {
  this._get(function(err, db) {
    if (err) return getCallback(args)(err);
    fn.apply(db, args);
  });
};

var isDriverDb = function(db) {
  var result = true;
  result = result && typeof db.admin === 'function';
  result = result && typeof db.close === 'function';
  result = result && typeof db.collection === 'function';
  result = result && typeof db.collectionNames === 'function';
  result = result && typeof db._get === 'undefined';

  return result;
};

var isMongojsDb = function(db) {
  var result = true;
  result = result && typeof db.close === 'function';
  result = result && typeof db.collection === 'function';
  result = result && typeof db.getCollectionNames === 'function';
  result = result && typeof db._get === 'function';

  return result;
};

var connect = function(config, collections) {
  if (isDriverDb(config)) {
    var driverDb = config;
  } else if (isMongojsDb(config)) {
    var mongojsDb = config;
  } else {
    var connectionString = parseConfig(config);
    var dbName = (connectionString.match(/\/([^\/\?]+)(\?|$)/) || [])[1] || 'db';
  }

  var ondb = thunky(function(callback) {
    mongodb.Db.connect(connectionString, function(err, db) {
      if (err) {
        that.emit('error', err);
        return callback(err);
      }
      that.client = db;
      that.emit('ready');
      db.on('error', function(err) {
        process.nextTick(function() {
          that.emit('error', err);
        });
      });
      callback(null, db);
    });
  });
  if (driverDb) {
    ondb = function(callback) {
      callback(null, driverDb);
    };
  }
  if (mongojsDb) {
    ondb = function(callback) {
      mongojsDb.open(function(err, db) {
        if (err) callback(err);
        callback(null, db);
      });
    }
  }
  var that = new Database(dbName, ondb);

  that.bson = mongodb.BSONPure; // backwards compat (require('bson') instead)
  that.ObjectId = mongodb.ObjectID; // backwards compat

  collections = collections || config.collections || [];
  collections.forEach(function(colName) {
    var parts = colName.split('.');
    var last = parts.pop();
    var parent = parts.reduce(function(parent, prefix) {
      return parent[prefix] = parent[prefix] || {};
    }, that);

    parent[last] = that.collection(colName);
  });

  if (typeof Proxy !== 'undefined') {
    var p = Proxy.create({
      get: function(obj, prop) {
        if (!that[prop]) that[prop] = that.collection(prop);
        return that[prop];
      }
    });

    return p;
  }
  return that;
};

connect.connect = connect; // backwards compat

// expose bson stuff visible in the shell
connect.ObjectId = mongodb.ObjectID;
connect.DBRef = mongodb.DBRef;
connect.Timestamp = mongodb.Timestamp;
connect.MinKey = mongodb.MinKey;
connect.MaxKey = mongodb.MaxKey;
connect.NumberLong = mongodb.Long;

connect.Cursor = Cursor;
connect.Collection = Collection;
connect.Database = Database;

module.exports = connect;
