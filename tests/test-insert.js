var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['a','b']);

db.a.insert([{name: "Squirtle"}, {name: "Charmander"}, {name: "Bulbasaur"}], function(err, docs) {
	assert.ok(docs[0]._id);
	assert.ok(docs[1]._id);
	assert.ok(docs[2]._id);
	db.close();
});
