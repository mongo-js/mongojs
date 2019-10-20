var insert = require('./insert')

insert('mapreduce', [{
  name: 'Squirtle', type: 'water', level: 10
}, {
  name: 'Starmie', type: 'water', level: 8
}, {
  name: 'Charmander', type: 'fire', level: 8
}, {
  name: 'Lapras', type: 'water', level: 12
}], function (db, t, done) {
  db.a.mapReduce(function () {
    /* eslint-disable no-undef */
    emit(this.type, this.level)
    /* eslint-enable no-undef */
  }, function (key, values) {
    return Array.sum(values)
  }, {
    query: { type: 'water' },
    out: 'levelSum'
  }, function (err) {
    t.error(err)
    db.collection('levelSum').findOne(function (err, res) {
      t.error(err)
      t.equal(res._id, 'water')
      t.equal(res.value, 30)
      db.collection('levelSum').drop(done)
    })
  })
})

insert('mapreduce finalize', [{
  name: 'Squirtle', type: 'water', level: 10
}, {
  name: 'Starmie', type: 'water', level: 8
}, {
  name: 'Charmander', type: 'fire', level: 8
}, {
  name: 'Lapras', type: 'water', level: 12
}], function (db, t, done) {
  db.a.mapReduce(function () {
    /* eslint-disable no-undef */
    emit(this.type, this.level)
    /* eslint-enable no-undef */
  }, function (key, values) {
    return {
      sum: Array.sum(values),
      count: values.length
    }
  }, {
    query: { type: 'water' },
    out: 'levelSum',
    finalize: function (key, reducedVal) {
      reducedVal.avg = reducedVal.sum / reducedVal.count
      return reducedVal
    }
  }, function (err) {
    t.error(err)
    db.collection('levelSum').findOne(function (err, res) {
      t.error(err)
      t.equal(res._id, 'water')
      t.equal(res.value.sum, 30)
      t.equal(res.value.avg, 10)
      db.collection('levelSum').drop(done)
    })
  })
})
