const test = require('tape')
const mongojs = require('../')

test('insert duplicate index key', (t) => {
  const db = mongojs('test', ['d'])

  db.d.drop(() => {
    // Ignore errors here
    db.d.ensureIndex({ type: 1 }, { unique: true }, (err) => {
      t.error(err)

      const now = new Date().toISOString()

      db.d.insert({ date: now }, (err) => {
        t.error(err)

        db.d.insert({ date: now }, (err) => {
          t.ok(err, 'should yield an error since we insert a index key for a unique index twice')

          t.end()
        })
      })
    })
  })
})
