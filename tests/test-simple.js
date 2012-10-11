var assert = require('assert');
var mongojs = require('mongojs');
var db = mongojs('test', ['a','b']);

db.a.find(function(err, docs) {
	assert.ok(!err);
	assert.equal(docs.length, 0);
	db.close();
});
