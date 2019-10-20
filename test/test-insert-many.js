var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('insertMany', function (t) {
  db.a.insertMany([{ name: 'Squirtle' }, { name: 'Charmander' }, { name: 'Bulbasaur' }], function (err, docs) {
    t.error(err)
    t.ok(docs[0]._id)
    t.ok(docs[1]._id)
    t.ok(docs[2]._id)

    db.a.remove(function () {
      db.close(t.end.bind(t))
    })
  })
})
