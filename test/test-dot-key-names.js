const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'b'])

test('dot key names', (t) => {
  db.a.save({ hello: 'world' }, (err, doc) => {
    t.error(err)
    t.equal(doc.hello, 'world')
    t.ok(doc._id)

    doc.hello = 'verden'
    db.a.save(doc, (err, doc) => {
      t.error(err)
      t.ok(doc._id)
      t.equal(doc.hello, 'verden')

      db.a.remove(() => {
        db.close(t.end.bind(t))
      })
    })
  })
})
