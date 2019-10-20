const insert = require('./insert')

const items = []
const itemCount = 10000

for (let i = 0; i < itemCount; i++) {
  items.push({ counter: i })
}

insert('find in large collection', items, (db, t, done) => {
  db.a.find().toArray((err, docs) => {
    t.error(err)
    t.equal(docs.length, itemCount)
    done()
  })
})
