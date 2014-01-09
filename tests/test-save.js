var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['a','b']);

db.a.save({hello: "world"}, function(err, doc) {
	assert.equal(doc.hello, "world");
	assert.ok(doc._id);

	doc.hello = "verden";
	db.a.save(doc, function(err, doc) {
		assert.ok(doc._id);
		assert.equal(doc.hello, "verden")
		db.a.remove(function() {
			db.close();
		});
	});
});
