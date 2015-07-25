var insert = require('./insert')

insert('remove', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}], function (db, t, done) {
  var cursor = db.a.find().sort({name: 1})
  cursor.next(function (err, obj1) {
    t.error(err)
    t.equal(obj1.name, 'Lapras')
    cursor.next(function (err, obj2) {
      t.error(err)
      t.equal(obj2.name, 'Squirtle')
      cursor.rewind()
      cursor.next(function (err) {
        t.error(err)
        t.equal(obj1.name, 'Lapras')
        t.end()
      })
    })
  })
})
