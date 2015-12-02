var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a'])

test('dropDatabase', function (t) {
  db.dropDatabase(function (err) {
    t.error(err, 'Should drop a connected database without an error')

    db.close(function (err) {
      t.error(err, 'Should close a connection to a dropped database')
      t.end()
    })
  })
})
