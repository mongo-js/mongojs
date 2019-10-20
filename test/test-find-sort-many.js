const insert = require('./insert')

const numTestDocs = 1500
const testDocs = []
for (let i = 0; i < numTestDocs; i++) {
  const document = {
    name: 'test-doc-' + i
  }
  testDocs.push(document)
}

insert('sort-many', testDocs, (db, t, done) => {
  db.a.find().sort({ name: 1 }, (err, docs) => {
    t.error(err)
    t.equal(docs.length, numTestDocs)
    t.end()
  })
})
