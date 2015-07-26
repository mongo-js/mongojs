var test = require('tape')
var mongojs = require('../index')

test('events destroy', function (t) {
  var db = mongojs('test', ['a'])

  db.on('destroy', function () {
    t.pass('destroy event emitted')
    t.end()
  })

  db.close(function (err) {
    t.error(err, 'should close without error')
  })
})
