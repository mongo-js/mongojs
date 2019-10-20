const insert = require('./insert')
const mongojs = require('../')

insert('find by ObjectId', [{
  hello: 'world'
}], (db, t, done) => {
  db.a.find({ _id: db.ObjectId('abeabeabeabeabeabeabeabe') }, { hello: 1 }, (err, docs) => {
    t.error(err)
    t.equal(docs.length, 0)

    db.a.save({ _id: mongojs.ObjectId('abeabeabeabeabeabeabeabe') }, () => {
      db.a.find({ _id: db.ObjectId('abeabeabeabeabeabeabeabe') }, { hello: 1 }, (err, docs) => {
        t.error(err)
        t.equal(docs.length, 1)
        done()
      })
    })
  })
})
