var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['test123']);

db.test123.drop(function() {
	db.createCollection('test123', function(err) {
		assert(!err);
		db.createCollection('test123', function(err) {
			assert(err);
			db.close();
		});
	});
});