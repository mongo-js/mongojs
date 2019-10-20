var test = require('./tape')
var mongojs = require('../')

test.skip('receive a mongojs instance', function (t) {
  var db = mongojs(mongojs('test', []), ['a'])
  var afterFind = function () {
    db.a.remove(function (err) {
      t.error(err)
      t.equal(db.toString(), 'test', 'should expose database name')

      db.close(function (err) {
        t.error(err)
        t.end()
      })
    })
  }

  var afterInsert = function (err) {
    t.error(err)

    db.a.findOne(function (err, data) {
      t.error(err)
      t.equal(data.name, 'Pidgey')
      afterFind()
    })
  }

  var afterRemove = function (err) {
    t.error(err)
    db.a.insert({ name: 'Pidgey' }, afterInsert)
  }

  db.a.remove(afterRemove)
})
