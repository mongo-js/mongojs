var test = require('tape');
var mongojs = require('../');
var db = mongojs('test');

test('receive a driver db instance', function(t) {
  var thedb = mongojs(db);
  t.ok(db === thedb);
  t.end();
});
