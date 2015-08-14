var test = require('tape')
var mongojs = require('../')

test('insert duplicate index key', function (t) {
  var db = mongojs('test', ['d'])

  db.d.drop(function () {
    // Ignore errors here
    db.d.ensureIndex({ type: 1 }, { unique: true }, function (err) {
      t.error(err)

      var now = new Date().toISOString()

      db.d.insert({ date: now }, function (err) {
        t.error(err)

        db.d.insert({ date: now }, function (err) {
          t.ok(err, 'should yield an error since we insert a index key for a unique index twice')

          t.end()
        })
      })
    })
  })
})
