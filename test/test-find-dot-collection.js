var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['test.dot'])

test('find in dot collection', function (t) {
  db['test.dot'].drop(function () {
    db['test.dot'].insert({ name: 'dot' }, function (err) {
      t.error(err)
      db['test.dot'].findOne(function (err, doc) {
        t.error(err)
        t.equal(doc.name, 'dot')
        t.end()
      })
    })
  })
})
