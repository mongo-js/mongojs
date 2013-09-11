var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['a']);

module.exports = function(docs, test) {
	db.a.remove(function(err) {
		assert.ok(!err);

		db.a.insert(docs, function(err) {
			assert.ok(!err);
			test(db, function() {
				db.a.remove(function(err) {
					assert.ok(!err);
					db.close();
				});
			});
		});

	});
};
