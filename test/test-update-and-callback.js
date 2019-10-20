const insert = require('./insert')

insert('update and callback', [{
  hello: 'world'
}], (db, t, done) => {
  let sync = true
  db.a.update({ hello: 'world' }, { $set: { hello: 'verden' } }, (err, lastErrorObject) => {
    t.ok(!sync)
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    done()
  })
  sync = false
})
