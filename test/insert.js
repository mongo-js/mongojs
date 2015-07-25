var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a'])

module.exports = function (testName, docs, testFn) {
  test(testName, function (t) {
    db.a.remove(function (err) {
      t.error(err)

      db.a.insert(docs, function (err) {
        t.error(err)
        testFn(db, t, function () {
          db.a.remove(function (err) {
            t.error(err)
            t.end()
          })
        })
      })

    })
  })
}

module.exports.skip = function (testName) {
  test.skip(testName, function (t) {
    t.end()
  })
}
