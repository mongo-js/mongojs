var insert = require('./insert')

insert('cursor.size', [{
  hello: 'world1'
}, {
  hello: 'world2'
}, {
  hello: 'world3'
}, {
  hello: 'world4'
}], function (db, t, done) {
  db.a.find().skip(1).size(function (err, thesize) {
    t.error(err)
    t.equal(thesize, 3)
    db.a.find().limit(2).size(function (err, theothersize) {
      t.error(err)
      t.equal(theothersize, 2)
      done()
    })
  })
})
