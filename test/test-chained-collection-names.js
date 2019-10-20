const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['b.c'])

test('chained-collection-names', (t) => {
  db.b.c.remove(() => {
    db.b.c.save({ hello: 'world' }, (err, rs) => {
      t.error(err)
      db.b.c.find((err, docs) => {
        t.error(err)
        t.equal(docs[0].hello, 'world')
        db.b.c.remove(() => {
          t.end()
        })
      })
    })
  })
})
