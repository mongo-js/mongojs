var test = require('tape');
var mongodb = require('mongodb');
var mongojs = require('../');
var each = require('each-series');

test('receive a driver db or mongojs instance', function(t) {
  mongodb.Db.connect('mongodb://localhost/test', function(err, thedb) {

    var doTests = function(db, callback) {
      var afterFind = function() {
        db.a.remove(function(err) {
          t.ok(!err);
          t.equal(db.toString(), 'test');
          callback();
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
    };

    each([mongojs(thedb, ['a']), mongojs(mongojs('test', []), ['a'])], function(db, i, cb) {
      doTests(db, cb);
    }, t.end.bind(t));
  });
});
