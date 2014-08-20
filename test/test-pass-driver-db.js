var test = require('tape');
var mongodb = require('mongodb');
var mongojs = require('../');

test('receive a driver db instance', function(t) {
  mongodb.Db.connect('mongodb://localhost/test', function(err, thedb) {
    var db = mongojs(thedb, ['a']);

    var afterFind = function() {
      db.a.remove(function(err) {
        t.ok(!err);
        t.equal(db.toString(), 'test');
        t.end();
      });
    };

    var afterInsert = function(err) {
      t.ok(!err);

      db.a.findOne(function(err, data) {
        t.equal(data.name, 'Pidgey');
        afterFind();
      });
    };

    var afterRemove = function(err) {
      t.ok(!err);
      db.a.insert({name: 'Pidgey'}, afterInsert);

    };
    db.a.remove(afterRemove);
  });
});
