var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world'
}], function(db, done) {
	db.a.find({_id:db.ObjectId('abeabeabeabeabeabeabeabe')}, {hello:1}, function(err, docs) {
		assert.ok(!err);
		assert.equal(docs.length, 0);

		db.a.save({_id:db.ObjectId('abeabeabeabeabeabeabeabe')}, function() {
			db.a.find({_id:db.ObjectId('abeabeabeabeabeabeabeabe')}, {hello:1}, function(err, docs) {
				assert.ok(!err);
				assert.equal(docs.length, 1);
				done();
			});
		});
	});
});