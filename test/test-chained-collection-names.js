var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['b.c'])

test('chained-collection-names', function (t) {
  db.b.c.remove(function () {
    db.b.c.save({ hello: 'world' }, function (err, rs) {
      t.error(err)
      db.b.c.find(function (err, docs) {
        t.error(err)
        t.equal(docs[0].hello, 'world')
        db.b.c.remove(function () {
          t.end()
        })
      })
    })
  })
})
