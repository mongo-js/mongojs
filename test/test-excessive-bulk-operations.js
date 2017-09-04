var insert = require('./insert')

insert('bulk', [{
  name: 'Squirtle', type: 'water'
}], function (db, t, done) {
  db.runCommand('serverStatus', function (err, resp) {
    t.error(err)
    if (parseFloat(resp.version) < 2.6) return t.end()

    var bulk = db.a.initializeOrderedBulkOp()
    var numberOfOp = 1066
    for (var i = 0; i < numberOfOp; ++i) {
      bulk.insert({name: 'Spearow', type: 'flying'})
    }

    bulk.execute(function (err, res) {
      t.error(err)
      t.ok(res.ok)
      db.a.find(function (err, res) {
        t.error(err)
        t.equal(res.length, numberOfOp + 1) // +1 because we inserted one doc before test
        t.end()
      })
    })
  })
})
