const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'b'])

test('optional callback', (t) => {
  db.a.ensureIndex({ hello: 'world' })
  setTimeout(() => {
    db.a.count(() => {
      db.close(t.end.bind(t))
    })
  }, 100)
})
