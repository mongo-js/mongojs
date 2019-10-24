const test = require('tape')
const mongojs = require('../')

test('collection options', (t) => {
  const db = mongojs('test', ['a'], { writeOpts: { writeConcern: { w: 3 }, ordered: false } })

  t.equal(db.a._writeOpts.writeConcern.w, 3, 'Should pass writeOpts to collection')
  t.equal(db.a._writeOpts.ordered, false, 'Should pass writeOpts to collection')

  t.end()
})
