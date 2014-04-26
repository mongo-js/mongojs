var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test');

if (typeof Proxy === 'undefined') process.exit(0);

db.a.remove(function() {
	db.a.insert({hello: 'world'}, function() {
		db.a.findOne(function(err, doc) {
			assert.equal(doc.hello, 'world');
			process.exit(0);
		});
	});
});
