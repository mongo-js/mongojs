var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['test123'])

test('createCollection', function (t) {
  db.test123.drop(function () {
    db.createCollection('test123', function (err) {
      t.error(err)
      db.createCollection('test123', function (err) {
        t.ok(err)
        t.end()
      })
    })
  })
})
