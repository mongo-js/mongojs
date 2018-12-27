var insert = require('./insert')

insert('find promise', [{
  hello: 'world'
}], async function (db, t, done) {
  let docs = await db.a.find().toArray()
  t.equal(docs.length, 1)
  t.equal(docs[0].hello, 'world')
  done()
})
