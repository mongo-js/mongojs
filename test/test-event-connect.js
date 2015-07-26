var test = require('./tape')
var mongojs = require('../index')

test('events connect', function (t) {
  var db = mongojs('test', ['a'])

  db.on('connect', function () {
    t.pass('connect event emitted')
    t.end()
  })

  db.a.find({}, function (err) { t.error(err, 'should find items without error') })
})
