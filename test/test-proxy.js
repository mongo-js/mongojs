const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test')

test('proxy', (t) => {
  if (typeof Proxy === 'undefined') return t.end()

  db.a.remove(() => {
    db.a.insert({ hello: 'world' }, () => {
      db.a.findOne((err, doc) => {
        t.error(err)
        t.equal(doc.hello, 'world')
        t.end()
      })
    })
  })
})
