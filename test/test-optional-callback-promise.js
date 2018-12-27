var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('optional callback promise', function (t) {
  db.a.ensureIndex({hello: 1})
  setTimeout(async function () {
    await db.a.count()
    await db.close()
    t.end()
  }, 100)
})
