var test = require('./tape')
var mongojs = require('../')

test('db.toString', function (t) {
  var db = mongojs('test', ['a'])
  t.equal(db.toString(), 'test', 'toString should return database name')
  t.end()
})
