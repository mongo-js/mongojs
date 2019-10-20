const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a'])

test('dropDatabase', (t) => {
  db.dropDatabase((err) => {
    t.error(err, 'Should drop a connected database without an error')

    db.close((err) => {
      t.error(err, 'Should close a connection to a dropped database')
      t.end()
    })
  })
})
