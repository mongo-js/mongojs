const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a'])

test('eval', (t) => {
  const sum = function (x, y) {
    return x + y
  }

  const failing = function () {
    throw new Error('Does not work')
  }

  db.eval(sum, 1, 2, (err, res) => {
    t.error(err, 'Should eval a function without an error')
    t.equal(res, 3, 'Should eval sum function')

    db.eval(failing, (err) => {
      t.ok(err, 'Should error when eval a function with missing operand is called')
      t.end()
    })
  })
})
