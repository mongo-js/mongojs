var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('insert', function (t) {
  db.a.insert([{name: 'Squirtle'}, {name: 'Charmander'}, {name: 'Bulbasaur'}], function (err, docs) {
    t.error(err)
    t.ok(docs[0]._id)
    t.ok(docs[1]._id)
    t.ok(docs[2]._id)

      // Ensure we old calls with "noop" (no callback) still happen as expected.
      // And that promises are cleaned up.
    var ignoredPromise = db.a.insert([{name: 'Pidgeotto'}])
    setTimeout(function () {
      db.a.find({name: 'Pidgeotto'}, function (err, docs) {
        t.error(err)
        t.equal(docs[0].name, 'Pidgeotto')
        t.equal(docs.length, 1)
        t.ok(ignoredPromise._done)
        db.a.remove(function () {
          db.close(t.end.bind(t))
        })
      })
    }, 200)
  })
})
