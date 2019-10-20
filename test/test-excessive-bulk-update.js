const insert = require('./insert')

insert('bulk', [{
  name: 'Squirtle', type: 'water'
}], (db, t, done) => {
  db.runCommand('serverStatus', (err, resp) => {
    t.error(err)
    if (parseFloat(resp.version) < 2.6) return t.end()

    const bulk = db.a.initializeOrderedBulkOp()
    const numberOfOp = 1066
    for (let i = 0; i < numberOfOp; ++i) {
      bulk.insert({ a: i })
    }

    bulk.execute((err, res) => {
      t.error(err)
      t.ok(res.ok)

      const bulk2 = db.a.initializeOrderedBulkOp()

      for (let i = 0; i < numberOfOp; i++) {
        bulk2.find({ a: i }).updateOne({ $set: { b: 'update by mongojs' } })
      }

      bulk2.execute((err, res) => {
        t.error(err)
        t.ok(res.ok)

        db.a.count({ b: 'update by mongojs' }, (err, count) => {
          t.error(err)
          t.equal(count, numberOfOp) // prior added documents not matched in query
          t.end()
        })
      })
    })
  })
})
