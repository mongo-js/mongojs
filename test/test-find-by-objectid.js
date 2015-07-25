var insert = require('./insert')
var mongojs = require('../')

insert('find by ObjectId', [{
  hello: 'world'
}], function (db, t, done) {
  db.a.find({_id: db.ObjectId('abeabeabeabeabeabeabeabe')}, {hello: 1}, function (err, docs) {
    t.error(err)
    t.equal(docs.length, 0)

    db.a.save({_id: mongojs.ObjectId('abeabeabeabeabeabeabeabe')}, function () {
      db.a.find({_id: db.ObjectId('abeabeabeabeabeabeabeabe')}, {hello: 1}, function (err, docs) {
        t.error(err)
        t.equal(docs.length, 1)
        done()
      })
    })
  })
})
