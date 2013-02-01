var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world'
}], function(db, done) {
	var sync = true;
	db.a.update({hello:'world'}, {$set:{hello:'verden'}}, function(err) {
		assert.ok(!sync);
		assert.ok(!err);
		done();
	});
	sync = false;
});