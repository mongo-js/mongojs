const insert = require('./insert')
const concat = require('concat-stream')

insert('aggregate', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Lapras', type: 'water'
}], (db, t, done) => {
  db.a.aggregate([{ $group: { _id: '$type' } }, { $project: { _id: 0, foo: '$_id' } }], (err, types) => {
    t.error(err)

    const arr = types.map((x) => { return x.foo })
    t.equal(types.length, 2)
    t.notEqual(arr.indexOf('fire'), -1)
    t.notEqual(arr.indexOf('water'), -1)

    // test as a stream
    const strm = db.a.aggregate([{ $group: { _id: '$type' } }, { $project: { _id: 0, foo: '$_id' } }])
    strm.pipe(concat((types) => {
      const arr = types.map((x) => { return x.foo })
      t.equal(types.length, 2)
      t.notEqual(arr.indexOf('fire'), -1)
      t.notEqual(arr.indexOf('water'), -1)
      t.end()
    }))
    strm.on('error', (err) => {
      // Aggregation cursors are only supported on mongodb 2.6+
      // this shouldn't fail the tests for other versions of mongodb
      if (err.message === 'unrecognized field "cursor') t.ok(1)
      else t.fail(err)
      t.end()
    })
  })
})
