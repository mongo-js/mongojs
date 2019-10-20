const insert = require('./insert')

insert('bulk', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Lapras', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}], (db, t, done) => {
  db.runCommand('serverStatus', (err, resp) => {
    t.error(err)
    if (parseFloat(resp.version) < 2.6) return t.end()

    const bulk = db.a.initializeOrderedBulkOp()
    bulk.find({ type: 'water' }).update({ $set: { level: 1 } })
    bulk.find({ type: 'water' }).update({ $inc: { level: 2 } })
    bulk.insert({ name: 'Spearow', type: 'flying' })
    bulk.insert({ name: 'Pidgeotto', type: 'flying' })
    bulk.insert({ name: 'Charmeleon', type: 'fire' })
    bulk.find({ type: 'flying' }).removeOne()
    bulk.find({ type: 'fire' }).remove()
    bulk.find({ type: 'water' }).updateOne({ $set: { hp: 100 } })

    bulk.find({ name: 'Squirtle' }).upsert().updateOne({ $set: { name: 'Wartortle', type: 'water' } })
    bulk.find({ name: 'Bulbasaur' }).upsert().updateOne({ $setOnInsert: { name: 'Bulbasaur' }, $set: { type: 'grass', level: 1 } })

    bulk.execute((err, res) => {
      t.error(err)
      t.ok(res.ok)
      db.a.find((err, res) => {
        t.error(err)
        t.equal(res[0].name, 'Wartortle')
        t.equal(res[1].name, 'Starmie')
        t.equal(res[2].name, 'Lapras')
        t.equal(res[3].name, 'Pidgeotto')
        t.equal(res[4].name, 'Bulbasaur')
        t.equal(res[4].type, 'grass')

        t.equal(res[0].level, 3)
        t.equal(res[1].level, 3)
        t.equal(res[2].level, 3)
        t.equal(res[4].level, 1)

        t.equal(res[0].hp, 100)
        t.end()
      })
    })
  })
})
