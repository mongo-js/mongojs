var test = require('./tape')
var cp = require('child_process')

test('crash', function (t) {
  var proc = cp.spawn('node', ['./crash.js'])
  proc.on('exit', function (code) {
    t.notEqual(code, 0)
    t.end()
  })
})
