var test = require('tape')
var wait = global.setImmediate || process.nextTick

wait(function () {
  test('end', function (t) {
    t.end()
    process.exit()
  })
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // Stack Trace
  console.log(reason.stack)
  process.exit(1)
})
module.exports = test
