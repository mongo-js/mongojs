const insert = require('./insert')

insert('get last error', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Lapras', type: 'water'
}], (db, t, done) => {
  db.getLastError((err, lastError) => {
    t.error(err)
    t.notOk(lastError, 'Should yield an empty last error')

    done()
  })
})
