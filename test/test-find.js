var insert = require('./insert')

insert('find', [{
  hello: 'world'
}], function (db, t, done) {
  db.a.find(function (err, docs) {
    t.error(err)
    t.equal(docs.length, 1)
    t.equal(docs[0].hello, 'world')
    done()
  })
})
