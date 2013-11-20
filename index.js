var mongodb = require('mongodb');
var thunky = require('thunky');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Readable = require('stream').Readable || require('readable-stream');

var DRIVER_COLLECTION_PROTO = mongodb.Collection.prototype;
var DRIVER_CURSOR_PROTO = mongodb.Cursor.prototype;
var DRIVER_DB_PROTO = mongodb.Db.prototype;

var noop = function() {};

var forEachMethod = function(oldProto, newProto, fn) {
	Object.keys(oldProto).forEach(function(methodName) {
		if (oldProto.__lookupGetter__(methodName) || newProto[methodName]) return;
		if (methodName[0] === '_' || typeof oldProto[methodName] !== 'function') return;
		fn(methodName, oldProto[methodName]);
	});
};

var ensureCallback = function(args) {
	if (getCallback(args) !== noop) return args;
	args = Array.prototype.slice.call(args);
	args.push(noop);
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
	this._apply(DRIVER_CURSOR_PROTO.toArray, arguments);
};

Cursor.prototype.next = function() {
	this._apply(DRIVER_CURSOR_PROTO.nextObject, arguments);
};

Cursor.prototype.forEach = function() {
	this._apply(DRIVER_CURSOR_PROTO.each, arguments);
};

Cursor.prototype.count = function() {
	this._apply(DRIVER_CURSOR_PROTO.count, arguments);
};

Cursor.prototype.explain = function() {
	this._apply(DRIVER_CURSOR_PROTO.explain, arguments);
};

Cursor.prototype.limit = function() {
	return this._config(DRIVER_CURSOR_PROTO.limit, arguments);
};

Cursor.prototype.skip = function() {
	return this._config(DRIVER_CURSOR_PROTO.skip, arguments);
};

Cursor.prototype.batchSize = function() {
	return this._config(DRIVER_CURSOR_PROTO.batchSize, arguments);
};

Cursor.prototype.sort = function() {
	return this._config(DRIVER_CURSOR_PROTO.sort, arguments);
};

Cursor.prototype.destroy = function() {
	this._apply(DRIVER_CURSOR_PROTO.close, arguments);
	this.push(null);
};

Cursor.prototype._apply = function(fn, args) {
	this._get(function(err, cursor) {
		if (err) return getCallback(args)(err);
		fn.apply(cursor, args);
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


// Proxy for the native collection prototype that normalizes method names and
// arguments to fit the mongo shell.

var Collection = function(oncollection) {
	this._get = oncollection;
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
	this._apply(DRIVER_COLLECTION_PROTO.findAndModify, [options.query, options.sort || [], options.update || {}, {
		new:!!options.new,
		remove:!!options.remove,
		upsert:!!options.upsert,
		fields:options.fields
	}, callback || noop]);
};

Collection.prototype.group = function(group, callback) {
	this._apply(DRIVER_COLLECTION_PROTO.group, [group.key ? group.key : group.keyf, group.cond, group.initial, group.reduce, group.finalize, true, callback]);
};

Collection.prototype.remove = function() {
	var self = this;
	var callback = getCallback(arguments);

	if (arguments.length > 1 && arguments[1] === true) { // the justOne parameter
		this.findOne(arguments[0], function(err, doc) {
			if (err) return callback(err);
			if (!doc) return callback(null, 0);
			self._apply(DRIVER_COLLECTION_PROTO.remove, [doc, callback]);
		});
		return;
	}

	this._apply(DRIVER_COLLECTION_PROTO.remove, arguments.length === 0 ? [{}, noop] : ensureCallback(arguments));
};

Collection.prototype.getIndexes = function() {
	this._apply(DRIVER_COLLECTION_PROTO.indexes, ensureCallback(arguments));
};

Collection.prototype.runCommand = function(cmd, opts, callback) {
	callback = callback || noop;
	opts = opts || {};
	if (typeof opts === 'function') {
		callback = opts;
	};
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

forEachMethod(DRIVER_COLLECTION_PROTO, Collection.prototype, function(methodName, fn) {
	Collection.prototype[methodName] = function() { // we just proxy the rest of the methods directly
		this._apply(fn, ensureCallback(arguments));
	};
});

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

var Database = function(ondb) {
	EventEmitter.call(this);
	this._get = ondb;
};

util.inherits(Database, EventEmitter);

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
	this.collections(function(err, cols) {
		if (err) return callback(err);
		callback(null, cols.map(function(c) {
			return c.collectionName;
		}));
	});
};

Database.prototype.createCollection = function(name, opts, callback) {
	if (typeof opts === 'function') {
		callback = opts;
		opts = {};
	}
	opts = opts || {};
	opts.strict = opts.strict !== false;
	this._apply(DRIVER_DB_PROTO.createCollection, [name, opts, callback || noop]);
};

Database.prototype.collection = function(name) {
	var self = this;

	var oncollection = thunky(function(callback) {
		self._get(function(err, db) {
			if (err) return callback(err);
			db.collection(name, callback);
		});
	});

	return new Collection(oncollection);
};

Database.prototype._apply = function(fn, args) {
	this._get(function(err, db) {
		if (err) return getCallback(args)(err);
		fn.apply(db, args);
	});
};

forEachMethod(DRIVER_DB_PROTO, Database.prototype, function(methodName, fn) {
	Database.prototype[methodName] = function() {
		this._apply(fn, arguments);
	};
});

var connect = function(config, collections) {
	var connectionString = parseConfig(config);

	var ondb = thunky(function(callback) {
		mongodb.Db.connect(connectionString, function(err, db) {
			if (err) return callback(err);
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
	var that = new Database(ondb);

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
