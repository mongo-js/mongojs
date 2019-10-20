var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'mycappedcol'])

test('isCapped', function (t) {
  db.mycappedcol.drop(function () {
    db.createCollection('mycappedcol', { capped: true, size: 1024 }, function (err) {
      t.error(err)
      db.mycappedcol.isCapped(function (err, ic) {
        t.error(err)
        t.ok(ic)
        db.a.insert({}, function (err) {
          t.error(err)
          db.a.isCapped(function (err, ic2) {
            t.error(err)
            t.notOk(ic2)
            db.mycappedcol.drop(t.end.bind(t))
          })
        })
      })
    })
  })
})
