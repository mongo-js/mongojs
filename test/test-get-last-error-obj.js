const insert = require('./insert')

insert('get last error obj', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Lapras', type: 'water'
}], (db, t, done) => {
  db.getLastErrorObj((err, errorObj) => {
    t.error(err)
    t.ok(errorObj, 'Should yield an error object')
    t.equal(errorObj.ok, 1, 'Should have ok of error object set to 1')

    done()
  })
})
