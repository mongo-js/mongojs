var insert = require('./insert')

// Delete just one
insert('remove', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}, {
  name: 'psyduck', type: 'water'
}], function (db, t, done) {
  // Remove just one
  db.a.remove({type: 'water'}, true, function (err, lastErrorObject) {
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    db.a.find({type: 'water'}, function (err, docs) {
      t.error(err)
      t.equal(docs.length, 3)
      t.equal(docs[0].name, 'Starmie')

      // remove one using object opts format
      db.a.remove({type: 'water'}, {limit: 1, writeConcern: {w: 1}, ordered: false}, function (err, lastErrorObject) {
        t.error(err)
        t.equal(lastErrorObject.n, 1)

        db.a.find({type: 'water'}, function (err, docs) {
          t.error(err)
          t.equal(docs.length, 2)
          t.equal(docs[0].name, 'Lapras')

          // Normal remove
          db.a.remove({type: 'water'}, function (err, lastErrorObject) {
            t.error(err)
            t.equal(lastErrorObject.n, 2)

            db.a.find({type: 'water'}, function (err, docs) {
              t.error(err)
              t.equal(docs.length, 0)
              done()
            })
          })
        })
      })
    })
  })
})
