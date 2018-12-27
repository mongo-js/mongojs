var insert = require('./insert')

insert('findOne', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], async function (db, t, done) {
  let doc = await db.a.findOne()
  t.equal(typeof doc, 'object')
  t.ok(doc.hello === 'world1' || doc.hello === 'world2')
  done()
})
