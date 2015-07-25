var insert = require('./insert')

insert('cursor.explain', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], function (db, t, done) {
  var cursor = db.a.find()
  cursor.explain(function (err, result) {
    t.error(err)
    if (result.executionStats) {
      t.equal(result.executionStats.totalDocsExamined, 2)
    } else {
      t.equal(result.nscannedObjects, 2)
    }
    done()
  })
})
