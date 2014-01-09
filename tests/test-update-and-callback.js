var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world'
}], function(db, done) {
	var sync = true;
	db.a.update({hello:'world'}, {$set:{hello:'verden'}}, function(err, lastErrorObject) {
		assert.ok(!sync);
		assert.ok(!err);
		assert.equal(lastErrorObject.updatedExisting, true);
		assert.equal(lastErrorObject.n, 1);

		done();
	});
	sync = false;
});
