var insert = require('./insert')

insert('findAndModify', [{
  id: 1,
  hello: 'you'
}, {
  id: 2,
  hello: 'other'
}], function (db, t, done) {
  // Update and find the old document
  db.a.findAndModify({
    query: { id: 1 },
    update: { $set: { hello: 'world' } }
  },
  function (err, doc, lastErrorObject) {
    t.error(err)
    t.equal(doc.id, 1)
    t.equal(doc.hello, 'you')
    t.equal(lastErrorObject.updatedExisting, true)
    t.equal(lastErrorObject.n, 1)

    // Update and find the new document
    db.a.findAndModify({
      query: { id: 2 },
      'new': true,
      update: { $set: { hello: 'me' } }
    }, function (err, doc, lastErrorObject) {
      t.error(err)
      t.equal(doc.id, 2)
      t.equal(doc.hello, 'me')
      t.equal(lastErrorObject.updatedExisting, true)
      t.equal(lastErrorObject.n, 1)

      // Remove and find document
      db.a.findAndModify({
        query: { id: 1 },
        remove: true
      }, function (err, doc, lastErrorObject) {
        t.error(err)
        t.equal(doc.id, 1)
        t.equal(lastErrorObject.n, 1)

        // Insert document using upsert
        db.a.findAndModify({
          query: { id: 3 },
          update: { id: 3, hello: 'girl' },
          'new': true,
          upsert: true
        }, function (err, doc, lastErrorObject) {
          t.error(err)
          t.equal(doc.id, 3)
          t.equal(doc.hello, 'girl')
          t.equal(lastErrorObject.updatedExisting, false)
          t.equal(lastErrorObject.n, 1)
          t.equal(String(lastErrorObject.upserted), String(doc._id))

          // Find non existing document
          db.a.findAndModify({
            query: { id: 0 },
            update: { $set: { hello: 'boy' } }
          }, function (err, doc, lastErrorObject) {
            t.error(err)
            t.equal(lastErrorObject.n, 0)

            done()
          })
        })
      })
    })
  })
})
