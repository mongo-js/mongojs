var assert = require('assert');
var mongojs = require('mongojs');
var db = mongojs('test', ['a']);

module.exports = function(docs, test) {
	db.a.remove(function(err) {
		assert.ok(!err);

		var insertNextDoc = function() {
			assert.ok(!err);
			if (!docs.length) {
				test(db, function() {
					db.a.remove(function(err) {
						assert.ok(!err);
						db.close();
					});
				});
				return;
			}
			db.a.save(docs.shift(), insertNextDoc);
		};

		insertNextDoc();
	});
};