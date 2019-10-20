const test = require('./tape')
const mongojs = require('../')

test('db.toString', (t) => {
  const db = mongojs('mongodb://localhost:50000,localhost:50001/test', ['a'])
  t.equal(db.toString(), 'test', 'toString should return database name')
  t.end()
})
