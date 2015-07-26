var insert = require('./insert')

insert('listCollections', [{
  hello: 'world'
}], function (db, t, done) {
  db.collection('b').save({hello: 'world'}, function (err, b) {
    t.error(err)
    db.listCollections(function (err, colNames) {
      t.error(err)
      t.notEqual(colNames.indexOf('a'), -1)
      t.notEqual(colNames.indexOf('b'), -1)
      done()
    })
  })
})
