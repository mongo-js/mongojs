var insert = require('./insert')

insert('update', [{
  hello: 'world'
}], function (db, t, done) {
  db.a.update({hello: 'world'}, {$set: {hello: 'verden'}}, function (err, lastErrorObject) {
    t.error(err)
    t.equal(lastErrorObject.n, 1)

    db.a.findOne(function (err, doc) {
      t.error(err)
      t.equal(doc.hello, 'verden')
      done()
    })
  })
})
