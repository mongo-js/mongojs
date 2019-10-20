const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a'])

test('drop user', (t) => {
  // Ignore errors when dropping the user
  db.dropUser('mongojs', () => {
    db.createUser({
      user: 'mongojs',
      pwd: 'topsecret',
      customData: { department: 'area51' },
      roles: ['readWrite']
    }, (err, res) => {
      t.error(err, 'Should create a user without an error')
      t.ok(res.ok)

      db.dropUser('mongojs', (err, res) => {
        t.error(err, 'Should drop an existing user without an error')
        t.ok(res.ok)

        t.end()
      })
    })
  })
})
