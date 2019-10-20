const insert = require('./insert')

insert('drop indexes', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Lapras', type: 'water'
}], (db, t, done) => {
  db.a.ensureIndex({ type: 1 }, (err) => {
    if (err && err.message === 'no such cmd: createIndexes') {
      // Index creation and deletion not supported for mongodb 2.4 and lower.
      t.ok(true)
      t.end()
      return
    }
    t.error(err)
    db.a.getIndexes((err, indexes) => {
      t.error(err)
      t.equal(indexes.length, 2)
      db.a.dropIndexes((err) => {
        t.error(err)

        db.a.getIndexes((err, indexes) => {
          t.error(err)
          t.equal(indexes.length, 1)
          t.end()
        })
      })
    })
  })
})
