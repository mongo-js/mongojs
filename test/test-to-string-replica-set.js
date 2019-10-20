const test = require('./tape')
const mongojs = require('../')

test('db.toString', (t) => {
  const db = mongojs('mongodb://localhost:27017,localhost:27018/test?replicaSet=foo', ['a'])
  t.equal(db.toString(), 'test', 'toString should return database name')
  t.end()
})
