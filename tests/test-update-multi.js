var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world1'
},{
	hello:'world2'
}], function(db, done) {
	db.a.update({}, {$set:{updated:true}}, {multi:true}, function(err) {
		assert.ok(!err);
		db.a.find(function(err, docs) {
			assert.ok(!err);
			assert.equal(docs.length, 2);
			assert.ok(docs[0].updated);
			assert.equal(docs[0].hello, 'world1');
			assert.ok(docs[1].updated);
			assert.equal(docs[1].hello, 'world2');
			done();
		});
	});
});