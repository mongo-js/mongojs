const test = require('./tape')
const mongojs = require('../')
const MongoClient = require('mongodb').MongoClient

test.skip('receive a mongodb db instance', (t) => {
  MongoClient.connect('mongodb://localhost/test', (err, mongoDb) => {
    t.error(err)

    const db = mongojs(mongoDb, ['a'])
    const afterFind = function () {
      db.a.remove((err) => {
        t.error(err)
        t.equal(db.toString(), 'test', 'should expose database name')

        db.close((err) => {
          t.error(err)
          t.end()
        })
      })
    }

    const afterInsert = function (err) {
      t.error(err)

      db.a.findOne((err, data) => {
        t.error(err)
        t.equal(data.name, 'Pidgey')
        afterFind()
      })
    }

    const afterRemove = function (err) {
      t.error(err)
      db.a.insert({ name: 'Pidgey' }, afterInsert)
    }

    db.a.remove(afterRemove)
  })
})
