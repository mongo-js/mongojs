var test = require('./tape');
var mongojs = require('../index');
var db = mongojs('test', ['a','b']);

test('simple', function(t) {
  db.a.find(function(err, docs) {
    t.ok(!err);
    t.equal(docs.length, 0);
    db.close(t.end.bind(t));
  });
});
