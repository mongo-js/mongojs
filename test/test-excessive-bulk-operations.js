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
      bulk.insert({ name: 'Spearow', type: 'flying' })
    }

    bulk.execute((err, res) => {
      t.error(err)
      t.ok(res.ok)
      db.a.find((err, res) => {
        t.error(err)
        t.equal(res.length, numberOfOp + 1) // +1 because we inserted one doc before test
        t.end()
      })
    })
  })
})
