const insert = require('./insert')

insert('cursor.rewind', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}], (db, t) => {
  const cursor = db.a.find().sort({ name: 1 })
  cursor.next((err, obj1) => {
    t.error(err)
    t.equal(obj1.name, 'Lapras')
    cursor.next((err, obj2) => {
      t.error(err)
      t.equal(obj2.name, 'Squirtle')
      cursor.rewind()
      cursor.next((err) => {
        t.error(err)
        t.equal(obj1.name, 'Lapras')
        t.end()
      })
    })
  })
})
