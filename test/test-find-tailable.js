var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['tailable'])

test('tailable find', function (t) {
  db.tailable.drop(function () {
    db.createCollection('tailable', { capped: true, size: 1024 }, function (err) {
      t.error(err, 'no error in creating the collection')

      var expected1 = { hello: 'world' }
      var expected2 = { hello: 'matteo' }

      var stream = db.tailable.find({}, {}, {
        tailable: true,
        timeout: false,
        awaitData: true,
        numberOfRetries: Number.MAX_VALUE
      })

      db.tailable.insert(expected1, function (err) {
        t.error(err, 'no error in insert')
        stream.once('data', function (obj) {
          t.deepEqual(obj, expected1, 'fetched object match')
          stream.once('data', function (obj) {
            t.deepEqual(obj, expected2, 'fetched object match')
            stream.destroy()
            db.tailable.drop(t.end.bind(t))
          })

          db.tailable.insert(expected2, function (err) {
            t.error(err, 'no error in insert')
          })
        })
      })
    })
  })
})
