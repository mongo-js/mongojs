const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'b'])

test('insert', (t) => {
  db.a.insert([{ name: 'Squirtle' }, { name: 'Charmander' }, { name: 'Bulbasaur' }], (err, docs) => {
    t.error(err)
    t.ok(docs[0]._id)
    t.ok(docs[1]._id)
    t.ok(docs[2]._id)

    // It should only return one document in the
    // callback when one document is passed instead of an array
    db.a.insert({ name: 'Lapras' }, (err, doc) => {
      t.error(err)
      t.equal(doc.name, 'Lapras')

      // If you pass a one element array the callback should
      // have a one element array
      db.a.insert([{ name: 'Pidgeotto' }], (err, docs) => {
        t.error(err)
        t.equal(docs[0].name, 'Pidgeotto')
        t.equal(docs.length, 1)
        db.a.remove(() => {
          db.close(t.end.bind(t))
        })
      })
    })
  })
})
