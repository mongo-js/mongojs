var insert = require('./insert')

insert('replaceOne', [{
  hello: 'world'
}], function (db, t, done) {
  db.a.replaceOne({ hello: 'world' }, { $set: { hello: 'verden' } }, function (err, lastErrorObject) {
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    db.a.findOne(function (err, doc) {
      t.error(err)
      t.equal(doc.hello, 'verden')

      db.a.replaceOne({ hello: 'verden' }, { hallo: 'verden' }, function (err, lastErrorObject) {
        t.error(err)
        t.equal(lastErrorObject.n, 1)

        db.a.find(function (err, docs) {
          t.error(err)
          t.equal(docs.length, 1)
          t.equal(docs[0].hello, undefined)
          t.equal(docs[0].hallo, 'verden')

          done()
        })
      })
    })
  })
})
