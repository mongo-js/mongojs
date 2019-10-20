const insert = require('./insert')

insert('collection.stats', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], (db, t, done) => {
  db.a.stats((err, stats) => {
    t.error(err)

    t.equal(stats.count, 2, 'Two documents should be in collection')

    done()
  })
})
