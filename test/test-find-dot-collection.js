var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['test.dot'])
var dbNoCollections = mongojs('test')

test('find in dot collection', function (t) {
  var collection = db['test.dot']
  testDropInsertAndFind(t, collection)
})

test('find in dot collection', function (t) {
  var collection = dbNoCollections.collection('test.dot')
  testDropInsertAndFind(t, collection)
})

function testDropInsertAndFind (t, collection) {
  collection.drop(function () {
    collection.insert({ name: 'dot' }, function (err) {
      t.error(err)
      collection.findOne(function (err, doc) {
        t.error(err)
        t.equal(doc.name, 'dot')
        t.end()
      })
    })
  })
}
