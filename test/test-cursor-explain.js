const insert = require('./insert')

insert('cursor.explain', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], (db, t, done) => {
  const cursor = db.a.find()
  cursor.explain((err, result) => {
    t.error(err)
    if (result.executionStats) {
      t.equal(result.executionStats.totalDocsExamined, 2)
    } else {
      t.equal(result.nscannedObjects, 2)
    }
    done()
  })
})
