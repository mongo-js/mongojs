var insert = require('./insert')

insert('db stats', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Lapras', type: 'water'
}], function (db, t) {
  db.stats(function (err, stats) {
    t.error(err, 'Should get stats without an error')
    t.ok(stats.ok, 'OK flag should be set in result')
    t.ok(stats.collections)
    t.ok(stats.indexes)

    t.end()
  })
})
