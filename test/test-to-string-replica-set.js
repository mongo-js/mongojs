var test = require('./tape')
var mongojs = require('../')

test('db.toString', function (t) {
  var db = mongojs('mongodb://localhost:27017,localhost:27018/test?replicaSet=foo', ['a'])
  t.equal(db.toString(), 'test', 'toString should return database name')
  t.end()
})
