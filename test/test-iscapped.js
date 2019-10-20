const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['a', 'mycappedcol'])

test('isCapped', (t) => {
  db.mycappedcol.drop(() => {
    db.createCollection('mycappedcol', { capped: true, size: 1024 }, (err) => {
      t.error(err)
      db.mycappedcol.isCapped((err, ic) => {
        t.error(err)
        t.ok(ic)
        db.a.insert({}, (err) => {
          t.error(err)
          db.a.isCapped((err, ic2) => {
            t.error(err)
            t.notOk(ic2)
            db.mycappedcol.drop(t.end.bind(t))
          })
        })
      })
    })
  })
})
