var insert = require('./insert')

insert('bulk to string', [{
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
    bulk.insert({ item: 'abc123', status: 'A', defaultQty: 500, points: 5 })
    bulk.insert({ item: 'ijk123', status: 'A', defaultQty: 100, points: 10 })
    bulk.find({ item: null }).update({ $set: { item: 'TBD' } })
    bulk.find({ status: 'D' }).removeOne()

    var result = bulk.toString()
    t.equals(typeof result, 'string', 'bulk.toString() should return a string')
    result = JSON.parse(result)
    t.equals(result.nInsertOps, 2, 'Should result in nInsertOps field set to 2')
    t.equals(result.nUpdateOps, 1, 'Should result in nUpdateOps field set to 1')
    t.equals(result.nRemoveOps, 1, 'Should result in nRemoveOps field set to 1')
    t.equals(result.nBatches, 3, 'Should result in nBatches field set to 3')

    done()
  })
})
