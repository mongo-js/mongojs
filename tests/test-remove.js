var assert = require('assert');
var insert = require('./insert');

// Delete just one
insert([{
	name:'Squirtle', type:'water' 
}, {
	name:'Starmie' , type:'water' 
}, {
	name:'Lapras'  , type:'water' 
}], function(db, done) {
	// Remove just one
	db.a.remove({type:'water'}, true, function(err) {
		db.a.find({type:'water'}, function(err, docs) {
			assert.equal(docs.length, 2);
			assert.equal(docs[0].name, 'Starmie')

			// Normal remove
			db.a.remove({type:'water'}, function(err) {
				db.a.find({type:'water'}, function(err, docs) {
					assert.equal(docs.length, 0);
					done();
				});
			});
		});
	});
});
