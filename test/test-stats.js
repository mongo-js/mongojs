var insert = require('./insert')

insert('collection.stats', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], function (db, t, done) {
  db.a.stats(function (err, stats) {
    t.error(err)

    t.equal(stats.count, 2, 'Two documents should be in collection')

    done()
  })
})
