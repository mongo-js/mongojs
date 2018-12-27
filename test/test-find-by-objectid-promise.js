var insert = require('./insert')
var mongojs = require('../')

insert('find by ObjectId', [{
  hello: 'world'
}], async function (db, t, done) {
  let docs = await db.a.find({_id: db.ObjectId('abeabeabeabeabeabeabeabe')}, {hello: 1}).toArray()
  t.equal(docs.length, 0)
  await db.a.save({_id: mongojs.ObjectId('abeabeabeabeabeabeabeabe')})
  docs = await db.a.find({_id: db.ObjectId('abeabeabeabeabeabeabeabe')}, {hello: 1}).toArray()
  t.equal(docs.length, 1)
  done()
})
