const insert = require('./insert')

insert('distinct', [{
  goodbye: 'world',
  hello: 'space'
}, {
  goodbye: 'world',
  hello: 'space'
}, {
  goodbye: 'earth',
  hello: 'space'
}, {
  goodbye: 'world',
  hello: 'space'
}], (db, t, done) => {
  db.a.distinct('goodbye', { hello: 'space' }, (err, docs) => {
    t.error(err)
    t.equal(docs.length, 2)
    t.equal(docs[0], 'world')
    done()
  })
})
