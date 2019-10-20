const insert = require('./insert')

insert('getCollectionNames', [{
  hello: 'world'
}], (db, t, done) => {
  db.collection('b').save({ hello: 'world' }, (err, b) => {
    t.error(err)
    db.getCollectionNames((err, colNames) => {
      t.error(err)
      t.notEqual(colNames.indexOf('a'), -1)
      t.notEqual(colNames.indexOf('b'), -1)
      done()
    })
  })
})
