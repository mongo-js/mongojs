var test = require('./tape')
var mongojs = require('../index')
var db = mongojs('test', ['a', 'b'])

test('save', function (t) {
  db.a.save({ hello: 'world' }, function (err, doc) {
    t.error(err)
    t.equal(doc.hello, 'world')
    t.ok(doc._id)

    doc.hello = 'verden'
    db.a.save(doc, function (err, doc) {
      t.error(err)
      t.ok(doc._id)
      t.equal(doc.hello, 'verden')

      delete doc.hello
      doc.hallo = 'verden'

      db.a.save(doc, function (err, doc) {
        t.error(err)
        t.ok(doc._id)
        t.equal(doc.hello, undefined)
        t.equal(doc.hallo, 'verden')

        db.a.findOne(function (err, doc) {
          t.error(err)
          t.ok(doc._id)
          t.equal(doc.hello, undefined)
          t.equal(doc.hallo, 'verden')

          db.a.remove(function () {
            db.close(t.end.bind(t))
          })
        })
      })
    })
  })
})
