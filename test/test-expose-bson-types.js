var test = require('./tape')
var mongojs = require('../index')

test('should export bson types', function (t) {
  t.ok(mongojs.Binary)
  t.ok(mongojs.Code)
  t.ok(mongojs.DBRef)
  t.ok(mongojs.Double)
  t.ok(mongojs.Long)
  t.ok(mongojs.MinKey)
  t.ok(mongojs.MaxKey)
  t.ok(mongojs.ObjectID)
  t.ok(mongojs.ObjectId)
  t.ok(mongojs.Symbol)
  t.ok(mongojs.Timestamp)
  t.ok(mongojs.Decimal128)

  t.end()
})
