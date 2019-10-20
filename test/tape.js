const test = require('tape')

const wait = global.setImmediate || process.nextTick

wait(() => {
  test('end', (t) => {
    t.end()
    process.exit()
  })
})

module.exports = test
