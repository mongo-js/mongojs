var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a'])

test('create user', function (t) {
  // Ignore errors when dropping the user
  db.dropUser('mongojs', function () {
    db.createUser({
      user: 'mongojs',
      pwd: 'topsecret',
      customData: { department: 'area51' },
      roles: ['readWrite']
    }, function (err, res) {
      t.error(err, 'Should create a user without an error')
      t.ok(res.ok)

      db.createUser({
        user: 'mongojs',
        pwd: 'topsecret',
        customData: { department: 'area51' },
        roles: ['readWrite']
      }, function (err) {
        t.ok(err, 'Should yield an error when creating a duplicate user')
        t.equal(err.code, 11000, 'Should yield a duplicate user error')

        t.end()
      })
    })
  })
})
