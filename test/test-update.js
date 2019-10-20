const insert = require('./insert')

insert('update', [{
  hello: 'world'
}], (db, t, done) => {
  db.a.update({ hello: 'world' }, { $set: { hello: 'verden' } }, (err, lastErrorObject) => {
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    db.a.findOne((err, doc) => {
      t.error(err)
      t.equal(doc.hello, 'verden')
      done()
    })
  })
})
