const insert = require('./insert')

insert('cursor.map', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], (db, t, done) => {
  const cursor = db.a.find()
  cursor.map((x) => {
    return x.hello
  }, (err, res) => {
    t.error(err)
    t.equal(res[0], 'world1')
    t.equal(res[1], 'world2')
    done()
  })
})
