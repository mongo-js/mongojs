const insert = require('./insert')

insert('findOne', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], (db, t, done) => {
  db.a.findOne((err, doc) => {
    t.error(err)
    t.equal(typeof doc, 'object')
    t.ok(doc.hello === 'world1' || doc.hello === 'world2')
    done()
  })
})
