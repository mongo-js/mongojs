const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a'])

test('create user', (t) => {
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

      db.createUser({
        user: 'mongojs',
        pwd: 'topsecret',
        customData: { department: 'area51' },
        roles: ['readWrite']
      }, (err) => {
        t.ok(err, 'Should yield an error when creating a duplicate user')
        t.equal(err.code, 11000, 'Should yield a duplicate user error')

        t.end()
      })
    })
  })
})
