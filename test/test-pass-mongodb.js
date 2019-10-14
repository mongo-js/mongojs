var test = require('./tape')
var mongojs = require('../')
var MongoClient = require('mongodb').MongoClient

test.skip('receive a mongodb db instance', function (t) {
  MongoClient.connect('mongodb://localhost/test', function (err, mongoDb) {
    t.error(err)

    var db = mongojs(mongoDb, ['a'])
    var afterFind = function () {
      db.a.remove(function (err) {
        t.error(err)
        t.equal(db.toString(), 'test', 'should expose database name')

        db.close(function (err) {
          t.error(err)
          t.end()
        })
      })
    }

    var afterInsert = function (err) {
      t.error(err)

      db.a.findOne(function (err, data) {
        t.error(err)
        t.equal(data.name, 'Pidgey')
        afterFind()
      })
    }

    var afterRemove = function (err) {
      t.error(err)
      db.a.insert({ name: 'Pidgey' }, afterInsert)
    }

    db.a.remove(afterRemove)
  })
})
