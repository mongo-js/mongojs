const insert = require('./insert')

insert('find().limit', [{
  hello: 'world'
}], (db, t, done) => {
  db.a.find().limit(1, (err, docs) => {
    t.error(err)
    t.equal(docs.length, 1)
    t.equal(docs[0].hello, 'world')
    done()
  })
})
