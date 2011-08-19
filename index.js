var mongo = require('mongodb');
var common = require('common');

var noop = function() {};

var normalizeId = function() {
	if (!mongo.BSONNative || !mongo.BSONNative.ObjectID) {
		return function(args) {
			return args;
		};
	}	
	return function(args) {	
		if (args[0] && typeof args[0] === 'object' && typeof args[0]._id === 'string') {
			args[0]._id = new mongo.BSONNative.ObjectID(args[0]._id);
		}
		return args;
	};
}();
var normalize = function() {
	var longify = function(val) {
		if (!val || typeof val !== 'object') {
			return val;
		}
		for (var i in val) {
			if (Object.prototype.toString.call(val[i]) === '[object Long]') {
				val[i] = parseInt(val[i], 10);
			} else if (i !== '_id' && typeof val[i] === 'object') {
				val[i] = longify(val[i]);
			}
		}
		return val;
	};
	
	return function(callback) {
		return function(err, val) {
			callback(err, longify(val));
		};
	};
}();
var parse = function(options) {
	if (typeof options === 'object') {
		return options;
	}
	var result = {};	
	var match = options.match(/(?:mongodb:\/\/)?(?:(.+):(.+)@)?(?:([^:]+)(?::(\d+))?\/)?(.+)/);
	
	result.username = match[1];
	result.password = match[2];
	result.host = match[3] || '127.0.0.1';
	result.port = parseInt(match[4] || 27017,10);
	result.db = match[5];

	return result;
};

// basicly just a proxy prototype
var Cursor = function(oncursor) {
	this._oncursor = oncursor;
};

Cursor.prototype.toArray = function(callback) {
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
	var callback = noop;
	
	if (typeof args[args.length-1] === 'function') {
		callback = args[args.length-1] = normalize(args[args.length-1]);
	}
	this._oncursor.get(common.fork(callback, function(cur) {
		cur[name].apply(cur, args);
	}));
	return this;
};

var Collection = function(oncollection) {
	this._oncollection = oncollection;
};

Collection.prototype.find = function() {
	var args = normalizeId(Array.prototype.slice.call(arguments));
	var oncursor = common.future();
	var oncollection = this._oncollection;
	
	// we provide sugar for doing find(query, callback) -> find(query).toArray(callback);
	if (typeof args[args.length-1] === 'function') {
		var callback = args.pop();
		
		oncursor.get(common.fork(callback, function(cur) {
			cur.toArray(normalize(callback));
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

Collection.prototype._exec = function(name, args) {
	var args = normalizeId(args);
	var callback = args[args.length-1];
	
	if (typeof callback === 'function') {
		args[args.length-1] = callback = normalize(callback);
	} else {
		callback = noop;
	}
	
	this._oncollection.get(common.fork(callback, function(col) {
		col[name].apply(col, args);
	}));
};

Object.keys(mongo.Collection.prototype).forEach(function(name) {
	if (!Collection.prototype[name] && typeof mongo.Collection.prototype[name] === 'function') {
		Collection.prototype[name] = function() {
			this._exec(name, arguments);
		};
	}	
});

exports.connect = function(url, collections) {
	url = parse(url);
	
	var that = {};
	var ondb = common.future();

	common.step([
		function(next) {
			var client = new mongo.Db(url.db, new mongo.Server(url.host, url.port), {native_parser:true});
			
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
			
			if (url.username) {
				db.authenticate(url.username, url.password, next);				
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
		if (!that[name] && typeof mongo.Db.prototype[name] === 'function') {
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