var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world1'
},{
	hello:'world2'
}], function(db, done) {
	var cursor = db.a.find().limit(1).skip(1);
	var runs = 0;

	cursor.next(function loop(err, doc) {
		if (!doc) {
			assert.equal(runs, 1);
			done();
			return;
		}
		assert.ok(!err);
		assert.equal(doc.hello, 'world2');
		assert.equal(typeof doc, 'object');
		runs++;
		cursor.next(loop);
	});
});