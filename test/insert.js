const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a'])

module.exports = function (testName, docs, testFn) {
  test(testName, (t) => {
    db.a.remove((err) => {
      t.error(err)

      db.a.insert(docs, (err) => {
        t.error(err)
        testFn(db, t, () => {
          db.a.remove((err) => {
            t.error(err)
            t.end()
          })
        })
      })
    })
  })
}

module.exports.skip = function (testName) {
  test.skip(testName, (t) => {
    t.end()
  })
}
