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
      bulk.insert({a: i})
    }

    bulk.execute(function (err, res) {
      t.error(err)
      t.ok(res.ok)

      var bulk2 = db.a.initializeOrderedBulkOp()

      for (var i = 0; i < numberOfOp; i++) {
        bulk2.find({a: i}).updateOne({$set: {b: 'update by mongojs'}})
      }

      bulk2.execute(function (err, res) {
        t.error(err)
        t.ok(res.ok)

        db.a.count({b: 'update by mongojs'}, function (err, count) {
          t.error(err)
          t.equal(count, numberOfOp) // prior added documents not matched in query
          t.end()
        })
      })
    })
  })
})
