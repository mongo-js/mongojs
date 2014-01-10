var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['a','b']);

db.a.insert([{name: "Squirtle"}, {name: "Charmander"}, {name: "Bulbasaur"}], function(err, docs) {
	assert.ok(docs[0]._id);
	assert.ok(docs[1]._id);
	assert.ok(docs[2]._id);

	// It should only return one document in the 
	// callback when one document is passed instead of an array
	db.a.insert({name: "Lapras"}, function(err, doc) {
		assert.equal(doc.name, "Lapras");

		// If you pass a one element array the callback should
		// have a one element array
		db.a.insert([{name: "Pidgeotto"}], function (err, docs) {
			assert.equal(docs[0].name, "Pidgeotto");
			assert.equal(docs.length, 1);
			db.a.remove(function() {
				db.close();
			});
		});
	});
});
