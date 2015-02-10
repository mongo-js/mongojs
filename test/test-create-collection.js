var test = require('./tape');
var mongojs = require('../index');
var db = mongojs('test', ['test123']);

test('createCollection', function(t) {
  db.test123.drop(function() {
    db.createCollection('test123', function(err) {
      t.ok(err == null, 'First create');
      db.createCollection('test123', function(err) {
        t.ok(err != null, 'Second create should fail');
        db.createCollection('test123', {strict: false}, function(err) {
          t.ok(err == null, 'Third create should pass');
          t.end();
        });
      });
    });
  });
});
