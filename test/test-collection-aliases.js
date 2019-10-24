const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', { a: 'a', aAlias: 'a' })

test('collection alias', (t) => {
  db.aAlias.insert([{ name: 'Squirtle' }, { name: 'Charmander' }, { name: 'Bulbasaur' }], (err, docs) => {
    t.error(err)
    t.ok(docs[0]._id)
    t.ok(docs[1]._id)
    t.ok(docs[2]._id)

    db.a.find({}, (err, docs) => {
      t.error(err)
      t.equal(docs.length, 3)

      db.a.insert({ name: 'Squirtle' }, err => {
        t.error(err)

        db.aAlias.find({}, (err, docs) => {
          t.error(err)
          t.equal(docs.length, 4)

          db.a.remove({}, (err) => {
            t.error(err)

            db.close(() => t.end())
          })
        })
      })
    })
  })
})
