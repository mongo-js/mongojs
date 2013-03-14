var mongodb = require('mongodb');
var thunky = require('thunky');
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

var getCallback = function(args) {
	var callback = args[args.length-1];
	return typeof callback === 'function' ? callback : noop;
};

// Proxy for the native cursor prototype that normalizes method names and
// arguments to fit the mongo shell.

var Cursor = function(oncursor) {
	Readable.call(this, {objectMode:true});
	this._get = oncursor;
};

Cursor.prototype.__proto__ = Readable.prototype;

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
	}, callback]);
};

Collection.prototype.remove = function() {
	this._apply(DRIVER_COLLECTION_PROTO.remove, arguments.length === 0 ? [{}] : arguments); // driver has a small issue with zero-arguments in remove
};

Collection.prototype.group = function(group, callback) {
	this._apply(DRIVER_COLLECTION_PROTO.group, [group.key, group.cond, group.initial, group.reduce, group.finalize, true, callback]);
};

forEachMethod(DRIVER_COLLECTION_PROTO, Collection.prototype, function(methodName, fn) {
	Collection.prototype[methodName] = function() { // we just proxy the rest of the methods directly
		this._apply(fn, arguments);
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

	cs = cs.replace(/^\//, '');

	if (cs.indexOf('/') < 0) return parseConfig('127.0.0.1/'+cs);
	if (cs.indexOf('mongodb://') !== 0) return parseConfig('mongodb://'+cs);

	return cs;
};

var connect = function(config, collections) {
	var that = {};
	var connectionString = parseConfig(config);

	var ondb = thunky(function(callback) {
		mongodb.Db.connect(connectionString, function(err, db) {
			if (err) return callback(err);
			that.client = db;
			callback(null, db);
		});
	});

	that.bson = mongodb.BSONPure; // backwards compat
	that.ObjectId = mongodb.ObjectID; // backwards compat

	that.collection = function(name) {
		if (that[name]) return that[name];

		var oncollection = thunky(function(callback) {
			ondb(function(err, db) {
				if (err) return callback(err);
				db.collection(name, callback);
			});
		});

		return that[name] = new Collection(oncollection);
	};

	collections = collections || config.collections || [];
	collections.forEach(that.collection);

	forEachMethod(DRIVER_DB_PROTO, that, function(methodName, fn) {
		that[methodName] = function() {
			var args = arguments;

			ondb(function(err, db) {
				if (err) return getCallback(args)(err);
				fn.apply(db, args);
			});
		};
	});

	return that;
};

connect.connect = connect; // backwards compat
connect.ObjectId = mongodb.ObjectID;
module.exports = connect;