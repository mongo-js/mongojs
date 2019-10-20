const insert = require('./insert')

insert('cursor.count', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}], (db, t, done) => {
  db.a.find().count((err, cnt) => {
    t.error(err)
    t.equal(cnt, 4)
    db.a.find({ type: 'water' }).count((err, cnt2) => {
      t.error(err)
      t.equal(cnt2, 3)
      done()
    })
  })
})
