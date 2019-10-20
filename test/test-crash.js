const test = require('./tape')
const cp = require('child_process')

test('crash', (t) => {
  const proc = cp.spawn('node', ['./crash.js'])
  proc.on('exit', (code) => {
    t.notEqual(code, 0)
    t.end()
  })
})
