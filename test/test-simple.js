const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'b'])

test('simple', (t) => {
  db.a.find((err, docs) => {
    t.error(err)
    t.equal(docs.length, 0)
    db.close(t.end.bind(t))
  })
})
