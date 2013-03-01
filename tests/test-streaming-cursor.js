var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world1'
},{
	hello:'world2'
}], function(db, done) {
	var cursor = db.a.find();
	var runs = 0;

	var loop = function() {
		var doc;

		while (doc = cursor.read()) {
			assert.ok(doc.hello === 'world1' || doc.hello === 'world2');
			assert.equal(typeof doc, 'object');
			runs++;
		}

		cursor.once('readable', loop);
	};

	cursor.on('end', function() {
		assert.equal(runs, 2);
		done();
	});

	loop();
});