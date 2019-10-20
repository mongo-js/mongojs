const insert = require('./insert')

const pokemons = [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}]

insert('cursor.foreach', pokemons, (db, t, done) => {
  let i = 0
  db.a.find().forEach((err, pkm) => {
    t.error(err)
    if (++i === 4) return t.end()
    t.equal(pkm.name, pokemons[i - 1].name)
  })
})
