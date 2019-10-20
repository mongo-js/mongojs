const insert = require('./insert')

insert('runCommand', [{
  hello: 'world'
}, {
  hello: 'world2'
}, {
  hello: 'world3'
}, {
  hello: 'world'
}], (db, t, done) => {
  db.runCommand({ count: 'a', query: {} }, (err, res) => {
    t.error(err)
    t.equal(res.n, 4)
    db.a.runCommand('count', { query: { hello: 'world' } }, (err, res) => {
      t.error(err)
      t.equal(res.n, 2)
      db.a.runCommand('distinct', { key: 'hello', query: {} }, (err, docs) => {
        t.error(err)
        t.equal(docs.values.length, 3)
        db.runCommand({ distinct: 'a', key: 'hello', query: { hello: 'world' } }, (err, docs) => {
          t.error(err)
          t.equal(docs.values.length, 1)
          db.runCommand('ping', (err, res) => {
            t.error(err)
            t.equal(res.ok, 1)
            db.a.runCommand('count', (err, res) => {
              t.error(err)
              t.equal(res.n, 4)
              done()
            })
          })
        })
      })
    })
  })
})
