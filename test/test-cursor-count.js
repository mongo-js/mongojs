var insert = require('./insert')

insert('remove', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}], function (db, t, done) {
  db.a.find().count(function (err, cnt) {
    t.error(err)
    t.equal(cnt, 4)
    db.a.find({type: 'water'}).count(function (err, cnt2) {
      t.error(err)
      t.equal(cnt2, 3)
      done()
    })
  })
})
