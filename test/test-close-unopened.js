const test = require('tape')
const mongojs = require('../')

test('close unopened db', (t) => {
  const db = mongojs('test', ['a'])

  db.close((err) => {
    t.error(err, 'should close without error')
    t.end()
  })
})
