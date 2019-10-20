const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'b'])

test('insertMany', (t) => {
  db.a.insertMany([{ name: 'Squirtle' }, { name: 'Charmander' }, { name: 'Bulbasaur' }], (err, docs) => {
    t.error(err)
    t.ok(docs[0]._id)
    t.ok(docs[1]._id)
    t.ok(docs[2]._id)

    db.a.remove(() => {
      db.close(t.end.bind(t))
    })
  })
})
