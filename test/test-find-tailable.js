const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['tailable'])

test('tailable find', (t) => {
  db.tailable.drop(() => {
    db.createCollection('tailable', { capped: true, size: 1024 }, (err) => {
      t.error(err, 'no error in creating the collection')

      const expected1 = { hello: 'world' }
      const expected2 = { hello: 'matteo' }

      const stream = db.tailable.find({}, {}, {
        tailable: true,
        timeout: false,
        awaitData: true,
        numberOfRetries: Number.MAX_VALUE
      })

      db.tailable.insert(expected1, (err) => {
        t.error(err, 'no error in insert')
        stream.once('data', (obj) => {
          t.deepEqual(obj, expected1, 'fetched object match')
          stream.once('data', (obj) => {
            t.deepEqual(obj, expected2, 'fetched object match')
            stream.destroy()
            db.tailable.drop(t.end.bind(t))
          })

          db.tailable.insert(expected2, (err) => {
            t.error(err, 'no error in insert')
          })
        })
      })
    })
  })
})
