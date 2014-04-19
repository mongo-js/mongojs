var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['a','b']);

db.a.ensureIndex({hello:'world'})
setTimeout(function() {
	db.a.count(function() {
		db.close();
	})
}, 100);