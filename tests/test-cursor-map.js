var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world1'
},{
	hello:'world2'
}], function(db, done) {
	var cursor = db.a.find();
	cursor.map(function(x) { 
		return x.hello 
	}, function(err, res) {
		assert.equal(res[0], 'world1');
		assert.equal(res[1], 'world2');
		done();
	});
});

