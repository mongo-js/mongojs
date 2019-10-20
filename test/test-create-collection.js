const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['test123'])

test('createCollection', (t) => {
  db.test123.drop(() => {
    db.createCollection('test123', (err) => {
      t.error(err)
      db.createCollection('test123', (err) => {
        t.ok(err)
        t.end()
      })
    })
  })
})
