var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['test123', 'test321'])

test('renameCollection', function (t) {
  db.test123.drop(function () {
    db.test321.drop(function () {
      db.createCollection('test123', function (err) {
        t.error(err)
        db.test123.rename('test321', function (err) {
          t.error(err)
          t.end()
        })
      })
    })
  })
})
