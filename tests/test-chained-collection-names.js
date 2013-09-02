var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['b.c']);

db.b.c.remove(function() {
	db.b.c.save({hello: "world"}, function(err, rs) {
		db.b.c.find(function(err, docs) {
			assert.equal(docs[0].hello, "world");
			db.b.c.remove(function() {
				db.close();
			});
		});
	});
});
