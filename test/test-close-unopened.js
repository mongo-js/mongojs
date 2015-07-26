var test = require('tape')
var mongojs = require('../')

test('close unopened db', function (t) {
  var db = mongojs('test', ['a'])

  db.close(function (err) {
    t.error(err, 'should close without error')
    t.end()
  })
})
