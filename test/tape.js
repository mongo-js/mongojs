var test = require('tape')

var wait = global.setImmediate || process.nextTick

wait(function () {
  test('end', function (t) {
    t.end()
    process.exit()
  })
})

module.exports = test
