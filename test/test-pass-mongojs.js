const test = require('./tape')
const mongojs = require('../')

test.skip('receive a mongojs instance', (t) => {
  const db = mongojs(mongojs('test', []), ['a'])
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
