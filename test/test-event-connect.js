const test = require('./tape')
const mongojs = require('../index')

test('events connect', (t) => {
  const db = mongojs('test', ['a'])

  db.on('connect', () => {
    t.pass('connect event emitted')
    t.end()
  })

  db.a.find({}, (err) => { t.error(err, 'should find items without error') })
})
