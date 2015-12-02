var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a'])

test('eval', function (t) {
  var sum = function (x, y) {
    return x + y
  }

  var failing = function () {
    throw new Error('Does not work')
  }

  db.eval(sum, 1, 2, function (err, res) {
    t.error(err, 'Should eval a function without an error')
    t.equal(res, 3, 'Should eval sum function')

    db.eval(failing, function (err) {
      t.ok(err, 'Should error when eval a function with missing operand is called')
      t.end()
    })
  })
})
