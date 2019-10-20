var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('insertOne', function (t) {
  db.a.insert({ name: 'Lapras' }, function (err, doc) {
    t.error(err)
    t.equal(doc.name, 'Lapras')

    db.a.insert({ name: 'Pidgeotto' }, function (err, doc) {
      t.error(err)
      t.equal(doc.name, 'Pidgeotto')

      db.a.remove(function () {
        db.close(t.end.bind(t))
      })
    })
  })
})
