var insert = require('./insert')

var pokemons = [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}]

insert('cursor.foreach', pokemons, function (db, t, done) {
  var i = 0
  db.a.find().forEach(function (err, pkm) {
    t.error(err)
    if (++i === 4) return t.end()
    t.equal(pkm.name, pokemons[i - 1].name)
  })
})
