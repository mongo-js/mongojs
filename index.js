var Database = require('./lib/database')
var mongodb = require('mongodb')

module.exports = function (connString, cols, options) {
  var db = new Database(connString, cols, options)
  if (typeof Proxy !== 'undefined') {
    var handler = {
      get: function (obj, prop) {
        // Work around for event emitters to work together with harmony proxy
        if (prop === 'on' || prop === 'emit') {
          return db[prop].bind(db)
        }

        if (db[prop]) return db[prop]
        // Work around for property 'Symbol(Symbol.toPrimitive)' with node v6.x or higher version
        if (typeof prop === 'symbol') return db[prop]

        db[prop] = db.collection(prop)
        return db[prop]
      }
    }

    return Proxy.create === undefined ? new Proxy({}, handler) : Proxy.create(handler)
  }

  return db
}

// expose bson stuff visible in the shell
module.exports.Binary = mongodb.Binary
module.exports.Code = mongodb.Code
module.exports.DBRef = mongodb.DBRef
module.exports.Double = mongodb.Double
module.exports.Int32 = mongodb.Int32
module.exports.Long = mongodb.Long
module.exports.MaxKey = mongodb.MaxKey
module.exports.MinKey = mongodb.MinKey
module.exports.NumberLong = mongodb.Long // Alias for shell compatibility
module.exports.ObjectId = mongodb.ObjectId
module.exports.ObjectID = mongodb.ObjectID
module.exports.Symbol = mongodb.Symbol
module.exports.Timestamp = mongodb.Timestamp
module.exports.Map = mongodb.Map
module.exports.Decimal128 = mongodb.Decimal128

// Add support for default ES6 module imports
module.exports.default = module.exports
