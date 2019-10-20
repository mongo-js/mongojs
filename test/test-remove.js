const insert = require('./insert')

// Delete just one
insert('remove', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}], (db, t, done) => {
  // Remove just one
  db.a.remove({ type: 'water' }, true, (err, lastErrorObject) => {
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    db.a.find({ type: 'water' }, (err, docs) => {
      t.error(err)
      t.equal(docs.length, 2)
      t.equal(docs[0].name, 'Starmie')

      // Normal remove
      db.a.remove({ type: 'water' }, (err, lastErrorObject) => {
        t.error(err)
        t.equal(lastErrorObject.n, 2)

        db.a.find({ type: 'water' }, (err, docs) => {
          t.error(err)
          t.equal(docs.length, 0)
          done()
        })
      })
    })
  })
})
