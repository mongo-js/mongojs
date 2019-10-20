const insert = require('./insert')

insert('find', [{
  hello: 'world'
}], (db, t, done) => {
  db.a.find((err, docs) => {
    t.error(err)
    t.equal(docs.length, 1)
    t.equal(docs[0].hello, 'world')
    done()
  })
})
