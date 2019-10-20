const insert = require('./insert')

insert('find query', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], (db, t, done) => {
  db.a.find({ hello: 'world2' }, (err, docs) => {
    t.error(err)
    t.equal(docs.length, 1)
    t.equal(docs[0].hello, 'world2')
    done()
  })
})
