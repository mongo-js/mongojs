var test = require('./tape');
var mongojs = require('../');
var each = require('each-series');

test('receive a driver db or mongojs instance', function(t) {

  var db = mongojs(mongojs('test', []), ['a']);
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
