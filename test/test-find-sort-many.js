var insert = require('./insert')

var numTestDocs = 1500
var testDocs = []
for (var i = 0; i < numTestDocs; i++) {
  var document = {
    name: 'test-doc-' + i
  }
  testDocs.push(document)
}

insert('sort-many', testDocs, function (db, t, done) {
  db.a.find().sort({name: 1}, function (err, docs) {
    t.error(err)
    t.equal(docs.length, numTestDocs)
    t.end()
  })
})
