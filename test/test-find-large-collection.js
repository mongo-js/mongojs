var insert = require('./insert')

var items = []
var itemCount = 10000

for (var i = 0; i < itemCount; i++) {
  items.push({ counter: i })
}

insert('find in large collection', items, function (db, t, done) {
  db.a.find().toArray(function (err, docs) {
    t.error(err)
    t.equal(docs.length, itemCount)
    done()
  })
})
