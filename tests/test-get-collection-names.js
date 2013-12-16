var assert = require('assert');
var insert = require('./insert');

insert([{
	hello:'world'
}], function(db, done) {
	db.collection('b').save({hello: "world"}, function(err, b) {
		db.getCollectionNames(function(err, colNames) {
			assert.notEqual(colNames.indexOf('a'), -1);
			assert.notEqual(colNames.indexOf('b'), -1);
			done();
		});
	});
});
