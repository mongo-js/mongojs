const insert = require('./insert')

insert('updateOne', [{
  hello: 'world'
}], (db, t, done) => {
  db.a.updateOne({ hello: 'world' }, { $set: { hello: 'verden' } }, (err, lastErrorObject) => {
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    db.a.findOne((err, doc) => {
      t.error(err)
      t.equal(doc.hello, 'verden')
      done()
    })
  })
})
