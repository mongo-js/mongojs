var qs = require('querystring');
var mongo = require('mongodb');
var common = require('common');

var PARSE_CONNECTION_STRING = /^(?:mongodb:\/\/)?(?:([^:]+):([^@]+)@)?(?:([^\/]+)\/)?([^?]+)(?:\?(.+))?$/;
var PARSE_HOST = /^([^:]+)(?::(\d+))?$/;

var noop = function() {};

var createObjectId = function() {
	if (!mongo.BSONNative || !mongo.BSONNative.ObjectID) {
	  return function(id) {
		return mongo.BSONPure.ObjectID.createFromHexString(id);
	  };
	}
	return function(id) {
		return new mongo.BSONNative.ObjectID(id);
	};
}();
var parseHost = function(host, result) {
	if (host && typeof host !== 'string') return host;

	host = (host || '127.0.0.1').match(PARSE_HOST);
	result = result && typeof result === 'object' ? result : {};
	result.host = host[1];
	result.port = parseInt(host[2] || 27017, 10);

	return result;
};
var parseConnectionString = function(url) {
	if (url && typeof url !== 'string') return url;

	url = url.match(PARSE_CONNECTION_STRING);

	var result = {};
	var options = qs.parse(url[5]);
	var host = (url[3] || '').split(',');

	result.db = url[4];
	result.username = url[1];
	result.password = url[2];

	if (host.length === 1) {
		parseHost(host[0], result);
	} else {
		result.replSet = {};
		result.replSet.slaveOk = options.slaveOk === 'true';
		result.replSet.members = host.map(parseHost);
	}

	return result;
};
var parseOptions = function(options) {
	options = parseConnectionString(options);

	if (options.replSet && Array.isArray(options.replSet)) {
		options.replSet = {members:options.replSet};
	}
	if (options.replSet) {
		if (!options.replSet.members) {
			throw new Error('replSet.members required');
		}
		options.replSet.members = options.replSet.members.map(parseHost);
	}

	return options;
};
var shouldExtend = function(that, proto, name) {
	if (name[0] === '_') return false;
	return !that[name] && !proto.__lookupGetter__(name) && typeof proto[name] === 'function';
};

// basicly just a proxy prototype
var Cursor = function(oncursor) {
	this._oncursor = oncursor;
};

Cursor.prototype.toArray = function() {
	this._exec('toArray', arguments);
};
Cursor.prototype.next = function() {
	this._exec('nextObject', arguments);
};
Cursor.prototype.forEach = function() {
	this._exec('each', arguments);
};
Cursor.prototype.count = function() {
	this._exec('count', arguments);
};
Cursor.prototype.sort = function() {
	return this._config('sort', arguments);
};
Cursor.prototype.limit = function(a) {
	return this._config('limit', arguments);
};
Cursor.prototype.skip = function() {
	return this._config('skip', arguments);
};
Cursor.prototype.batchSize = function() {
	return this._config('batchSize', arguments);
};

Cursor.prototype._config = function(name, args) {
	if (typeof args[args.length-1] === 'function') {
		args = Array.prototype.slice.call(args);

		var callback = args.pop();

		this._exec(name, args).toArray(callback);
		return;
	}
	return this._exec(name, args);
};
Cursor.prototype._exec = function(name, args) {
	var callback = typeof args[args.length-1] === 'function' ? args[args.length-1] : noop;

	this._oncursor.get(common.fork(callback, function(cur) {
		cur[name].apply(cur, args);
	}));
	return this;
};

var Collection = function(oncollection) {
	this._oncollection = oncollection;
};

Collection.prototype.find = function() {
	var args = Array.prototype.slice.call(arguments);
	var oncursor = common.future();
	var oncollection = this._oncollection;

	// we provide sugar for doing find(query, callback) -> find(query).toArray(callback);
	if (typeof args[args.length-1] === 'function') {
		var callback = args.pop();

		oncursor.get(common.fork(callback, function(cur) {
			cur.toArray(callback);
		}));
	}

	common.step([
		function(next) {
			oncollection.get(next);
		},
		function(col, next) {
			args.push(next);
			col.find.apply(col, args);
		},
		function(cur) {
			oncursor.put(null, cur);
		}
	], oncursor.put);

	return new Cursor(oncursor);
};
Collection.prototype.findOne = function() { // see http://www.mongodb.org/display/DOCS/Queries+and+Cursors
	var args = Array.prototype.slice.call(arguments);
	var callback = args.pop();

	this.find.apply(this, args).limit(1).next(callback);
};
Collection.prototype.findAndModify = function(options, callback) {
	this._exec('findAndModify', [options.query, options.sort || [], options.update || {}, {
		new:!!options.new,
		remove:!!options.remove,
		upsert:!!options.upsert,
		fields:options.fields
	}, callback]);
};
Collection.prototype.remove = function() {
	this._exec('remove', arguments.length === 0 ? [{}] : arguments); // driver has a small issue with zero-arguments in remove
};
Collection.prototype.group = function(group, callback) {
	this._exec('group', [group.key, group.cond, group.initial, group.reduce, group.finalize, true], callback);
};
Collection.prototype.disconnect = function() {
	this.close();
};

Collection.prototype._exec = function(name, args) {
	var callback = typeof args[args.length-1] === 'function' ? args[args.length-1] : noop;

	this._oncollection.get(common.fork(callback, function(col) {
		var old = col.opts.safe;

		if (callback !== noop) {
			col.opts.safe = true;
		}
		col[name].apply(col, args);
		col.opts.safe = old;
	}));
};

Object.keys(mongo.Collection.prototype).forEach(function(name) { // we just wanna proxy any remaining methods on collections
	if (shouldExtend(Collection.prototype, mongo.Collection.prototype, name)) {
		Collection.prototype[name] = function() {
			this._exec(name, arguments);
		};
	}
});

var connect = function(url, collections) {
	var that = {};
	var options = parseOptions(url);
	var ondb = common.future();

	options.collections = options.collections || collections || [];

	common.step([
		function(next) {
			var replSet = options.replSet && new mongo.ReplSetServers(options.replSet.members.map(function(member) {
				return new mongo.Server(member.host, member.port, {auto_reconnect:true});
			}), {
				read_secondary:options.replSet.slaveOk,
				rs_name:options.replSet.name
			});

			var client = new mongo.Db(options.db, replSet || new mongo.Server(options.host, options.port, {auto_reconnect:true}), {safe:false});

			that.client = client;
			that.bson = {
				Long:      client.bson_serializer.Long,
				ObjectID:  client.bson_serializer.ObjectID,
				Timestamp: client.bson_serializer.Timestamp,
				DBRef:     client.bson_serializer.DBRef,
				Binary:    client.bson_serializer.Binary,
				Code:      client.bson_serializer.Code
			};

			client.open(next);
		},
		function(db, next) {
			this.db = db;

			if (options.username) {
				db.authenticate(options.username, options.password, next);
			} else {
				next(null, true);
			}
		},
		function(success) {
			if (!success) {
				ondb.put(new Error('invalid username or password'));
				return;
			}
			ondb.put(null, this.db);
		}
	], ondb.put);

	that.ObjectId = createObjectId;
	that.collection = function(name) {
		var oncollection = common.future();

		common.step([
			function(next) {
				ondb.get(next);
			},
			function(db, next) {
				db.collection(name, next);
			},
			function(col) {
				oncollection.put(null, col);
			}
		], oncollection.put);

		return new Collection(oncollection);
	};

	Object.keys(mongo.Db.prototype).forEach(function(name) {
		if (shouldExtend(that, mongo.Db.prototype, name)) {
			that[name] = function() {
				var args = arguments;
				var callback = args[args.length-1] || noop;

				ondb.get(common.fork(callback, function(db) {
					db[name].apply(db, args);
				}));
			};
		}
	});

	if (collections) {
		collections.forEach(function(col) {
			that[col] = that.collection(col);
		});
	}
	if (typeof Proxy !== 'undefined') {
		return Proxy.create({
			get: function(proxy, name) {
				if (!that[name]) {
					that[name] = that.collection(name);
				}
				return that[name];
			}
		});
	}

	return that;
};

exports = module.exports = connect;
exports.ObjectId = createObjectId;
exports.connect = exports; // for backwards compat