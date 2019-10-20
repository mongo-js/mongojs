const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'b'])

test('insertOne', (t) => {
  db.a.insert({ name: 'Lapras' }, (err, doc) => {
    t.error(err)
    t.equal(doc.name, 'Lapras')

    db.a.insert({ name: 'Pidgeotto' }, (err, doc) => {
      t.error(err)
      t.equal(doc.name, 'Pidgeotto')

      db.a.remove(() => {
        db.close(t.end.bind(t))
      })
    })
  })
})
