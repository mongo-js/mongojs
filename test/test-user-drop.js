var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a'])

test('drop user', function (t) {
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

      db.dropUser('mongojs', function (err, res) {
        t.error(err, 'Should drop an existing user without an error')
        t.ok(res.ok)

        t.end()
      })
    })
  })
})
