var insert = require('./insert')

insert('update promise', [{
  hello: 'world'
}], async function (db, t, done) {
  let info = await db.a.update({hello: 'world'}, {$set: {hello: 'verden'}})

  t.equal(info.n, 1)

  let doc = await db.a.findOne()
  t.equal(doc.hello, 'verden')
  done()
})
