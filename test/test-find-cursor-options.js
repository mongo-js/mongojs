var insert = require('./insert')

insert('find cursor options', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], function (db, t, done) {
  var cursor = db.a.find().sort({ _id: 1 }).limit(1).skip(1)
  var runs = 0

  cursor.next(function loop (err, doc) {
    if (!doc) {
      t.equal(runs, 1)
      done()
      return
    }
    t.error(err)
    t.equal(doc.hello, 'world2')
    t.equal(typeof doc, 'object')
    runs++
    cursor.next(loop)
  })
})
