var test = require('tape')
var mongodb = require('mongodb')
var mongojs = require('../')

test('connect native mongodb', function (t) {
  mongodb('mongodb://localhost/test', function (err, nativeDB) {
    t.equal(err, null)
    var db = mongojs(nativeDB, ['a'])
    t.equal(db._dbname, 'test')
    t.end()
  })
})
