const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['test123', 'test321'])

test('renameCollection', (t) => {
  db.test123.drop(() => {
    db.test321.drop(() => {
      db.createCollection('test123', (err) => {
        t.error(err)
        db.test123.rename('test321', (err) => {
          t.error(err)
          t.end()
        })
      })
    })
  })
})
