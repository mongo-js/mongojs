const test = require('tape')
const mongojs = require('../')

test('connect non existing db', (t) => {
  const db = mongojs('mongodb://1.0.0.1:23/aiguillage?connectTimeoutMS=100', ['a'])
  db.on('error', console.log)

  db.runCommand({ ping: 1 }, (err) => {
    t.ok(err, 'Should yield an error if non connection to db could be established')

    db.runCommand({ ping: 1 }, (err) => {
      t.ok(err, 'Should yield an error if non connection to db could be established')

      t.end()
    })
  })
})
