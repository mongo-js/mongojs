const insert = require('./insert')

insert('streaming cursor', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], (db, t, done) => {
  const cursor = db.a.find()
  let runs = 0

  const loop = function () {
    let doc

    while ((doc = cursor.read()) !== null) {
      t.ok(doc.hello === 'world1' || doc.hello === 'world2')
      t.equal(typeof doc, 'object')
      runs++
    }

    cursor.once('readable', loop)
  }

  cursor.on('end', () => {
    t.equal(runs, 2)
    done()
  })

  loop()
})
