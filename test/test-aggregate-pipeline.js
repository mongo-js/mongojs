var insert = require('./insert')
var concat = require('concat-stream')

insert('aggregate', [{
  name: 'Squirtle', type: 'water'
}, {
  name: 'Starmie', type: 'water'
}, {
  name: 'Charmander', type: 'fire'
}, {
  name: 'Lapras', type: 'water'
}], function (db, t, done) {
  db.a.aggregate([{$group: {_id: '$type'}}, {$project: { _id: 0, foo: '$_id' }}], function (err, types) {
    console.log(err, types)
    var arr = types.map(function (x) {return x.foo})
    console.log('arr', arr)
    t.equal(types.length, 2)
    console.log('here')
    t.notEqual(arr.indexOf('fire'), -1)
    console.log('there')
    t.notEqual(arr.indexOf('water'), -1)
    console.log('where')

    // test as a stream
    var strm = db.a.aggregate([{$group: {_id: '$type'}}, {$project: {_id: 0, foo: '$_id'}}])
    strm.pipe(concat(function (types) {
      var arr = types.map(function (x) {return x.foo})
      t.equal(types.length, 2)
      t.notEqual(arr.indexOf('fire'), -1)
      t.notEqual(arr.indexOf('water'), -1)
      t.end()
    }))
    strm.on('error', function (err) {
      // Aggregation cursors are only supported on mongodb 2.6+
      // this shouldn't fail the tests for other versions of mongodb
      if (err.message === 'unrecognized field "cursor') t.ok(1)
      else t.fail(err)
      t.end()
    })
  })
})
