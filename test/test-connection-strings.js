var test = require('tape')
var mongojs = require('../')

test('connection string parsing', function (t) {
  var db = mongojs('mongodb://localhost,localhost:28017/test', ['a'])
  t.equal(db._dbname, 'test')

  db = mongojs('test', ['a'])
  t.equal(db._dbname, 'test')

  db = mongojs('mongodb://localhost/test', ['a'])
  t.equal(db._dbname, 'test')
  t.equal(db._connString, 'mongodb://localhost/test')

  db = mongojs('mongodb+srv://username:passwor>@test.mongodb.net/test', ['a'])
  t.equal(db._dbname, 'test')
  t.equal(db._connString, 'mongodb+srv://username:passwor>@test.mongodb.net/test')

  db = mongojs('localhost/test', ['a'])
  t.equal(db._dbname, 'test')

  t.end()
})
