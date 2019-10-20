const test = require('tape')
const mongojs = require('../')

test('events close', (t) => {
  const db = mongojs('test', ['a'])

  db.on('close', () => {
    t.pass('close event emitted')
    t.end()
  })

  db.close((err) => {
    t.error(err, 'should close without error')
  })
})
