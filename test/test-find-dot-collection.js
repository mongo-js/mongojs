const test = require('./tape')
const mongojs = require('../index')
const db = mongojs('test', ['test.dot'])
const dbNoCollections = mongojs('test')

test('find in dot collection', (t) => {
  const collection = db['test.dot']
  testDropInsertAndFind(t, collection)
})

test('find in dot collection', (t) => {
  const collection = dbNoCollections.collection('test.dot')
  testDropInsertAndFind(t, collection)
})

function testDropInsertAndFind (t, collection) {
  collection.drop(() => {
    collection.insert({ name: 'dot' }, (err) => {
      t.error(err)
      collection.findOne((err, doc) => {
        t.error(err)
        t.equal(doc.name, 'dot')
        t.end()
      })
    })
  })
}
