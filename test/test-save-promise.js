var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('save', async function (t) {
  let doc = await db.a.save({hello: 'world'})
  t.equal(doc.hello, 'world')
  t.ok(doc._id)

  doc.hello = 'verden'
  doc = await db.a.save(doc)
  t.ok(doc._id)
  t.equal(doc.hello, 'verden')
  await db.a.remove()

  await db.close()
  t.end()
})
