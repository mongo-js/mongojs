var insert = require('./insert')

insert('bulk', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}], function (db, t, done) {
  db.runCommand('serverStatus', function (err, resp) {
    t.error(err)
    if (parseFloat(resp.version) < 2.6) return t.end()

    var bulk = db.a.initializeUnorderedBulkOp()
    bulk.find({ name: 'Squirtle' }).replaceOne({ name: 'Charmander', type: 'fire' })
    bulk.find({ name: 'Starmie' }).replaceOne({ type: 'fire' })

    bulk.execute(function (err, res) {
      t.error(err)
      t.ok(res.ok)
      db.a.find(function (err, res) {
        t.error(err)
        t.equal(res[0].name, 'Charmander')
        t.equal(res[1].name, undefined)

        t.equal(res[0].type, 'fire')
        t.equal(res[1].type, 'fire')

        t.end()
      })
    })
  })
})
