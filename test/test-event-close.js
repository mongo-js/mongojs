var test = require('tape')
var mongojs = require('../')

test('events close', function (t) {
  var db = mongojs('test', ['a'])

  db.on('close', function () {
    t.pass('close event emitted')
    t.end()
  })

  db.close(function (err) {
    t.error(err, 'should close without error')
  })
})
