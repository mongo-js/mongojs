var insert = require('./insert')

insert('updateMany', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], function (db, t, done) {
  db.a.updateMany({}, { $set: { updated: true } }, function (err, lastErrorObject) {
    t.error(err)
    t.equal(lastErrorObject.n, 2)

    db.a.find(function (err, docs) {
      t.error(err)
      t.equal(docs.length, 2)
      t.ok(docs[0].updated)
      t.equal(docs[0].hello, 'world1')
      t.ok(docs[1].updated)
      t.equal(docs[1].hello, 'world2')
      done()
    })
  })
})
