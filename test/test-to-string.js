const test = require('./tape')
const mongojs = require('../')

test('db.toString', (t) => {
  const db = mongojs('test', ['a'])
  t.equal(db.toString(), 'test', 'toString should return database name')
  t.end()
})
