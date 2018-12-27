var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('insert promise', async function (t) {
  let docs = await db.a.insert(
    [{ name: 'Squirtle' }, { name: 'Charmander' }, { name: 'Bulbasaur' }])
  t.ok(docs[0]._id)
  t.ok(docs[1]._id)
  t.ok(docs[2]._id)

      // It should only return one document in the
      // callback when one document is passed instead of an array
  let doc = await db.a.insert({ name: 'Lapras' })
  t.equal(doc.name, 'Lapras')

      // If you pass a one element array the callback should
      // have a one element array
  let docs2 = await db.a.insert([{ name: 'Pidgeotto' }])
  t.equal(docs2[0].name, 'Pidgeotto')
  t.equal(docs2.length, 1)
  await db.a.remove()
  db.close(t.end.bind(t))
})
