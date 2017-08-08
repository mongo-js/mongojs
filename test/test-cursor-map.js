var insert = require('./insert')

insert('cursor.map', [{
  hello: 'world1'
}, {
  hello: 'world2'
}], function (db, t, done) {
  var cursor = db.a.find()
  cursor.map(function (x) {
    return x.hello
  }, function (err, res) {
    t.error(err)
    t.equal(res.length, 2)
    t.notEqual(res.indexOf('world1'), -1)
    t.notEqual(res.indexOf('world2'), -1)
    done()
  })
})

