
var assert = require('assert');
var insert = require('./insert');

insert([{
	hello: "world"
},{
	hello: "world2"
},{
	hello: "world3"
},{
	hello: "world"
}], function(db, done) {
	db.runCommand({count: "a", query:{}}, function(err, res) {
		assert.equal(res.n, 4);
		db.a.runCommand('count', {query: {hello: "world"}}, function(err, res) {
			assert.equal(res.n, 2);
			db.a.runCommand('distinct', {key: "hello", query:{}}, function(err, docs) {
				assert.equal(docs.values.length, 3);
				db.runCommand({distinct:'a', key:"hello", query:{hello:"world"}}, function(err, docs) {
					assert.equal(docs.values.length, 1);
					db.runCommand("ping", function(err, res) {
						assert.equal(res.ok,1);
						db.a.runCommand("count", function(err, res) {
							assert.equal(res.n, 4);
							done();
						});
					});

				});
			});
		});
	});
});
