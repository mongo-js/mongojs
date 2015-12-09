var insert = require('./insert')

insert('empty bulk', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}], function (db, t, done) {
  db.runCommand('serverStatus', function (err, resp) {
    t.error(err)
    if (parseFloat(resp.version) < 2.6) return t.end()

    var bulk = db.a.initializeOrderedBulkOp()
    bulk.execute(function (err, result) {
      t.error(err, 'Should not yield an error')
      t.equals(result.ok, 1, 'Should result in ok field set to 1')

      done()
    })
  })
})
