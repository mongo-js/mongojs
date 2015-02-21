var test = require('./tape');
var mongojs = require('../index');
var db = mongojs('test');

test('proxy', function(t) {
  if (typeof Proxy === 'undefined') return t.end();

  db.a.remove(function() {
    db.a.insert({hello: 'world'}, function() {
      db.a.findOne(function(err, doc) {
        t.equal(doc.hello, 'world');
        t.end();
      });
    });
  });
});
