var Database = require('./lib/database')
var mongodb = require('mongodb')

module.exports = function (connString, cols, options) {
  var db = new Database(connString, cols, options)
  if (typeof Proxy !== 'undefined') {
    var p = Proxy.create({
      get: function (obj, prop) {
        // Work around for event emitters to work together with harmony proxy
        if (prop === 'on' || prop === 'emit') {
          return db[prop].bind(db)
        }

        if (db[prop]) return db[prop]
        db[prop] = db.collection(prop)
        return db[prop]
      }
    })

    return p
  }

  return db
}

// expose bson stuff visible in the shell
module.exports.Binary = mongodb.Binary
module.exports.Code = mongodb.Code
module.exports.DBRef = mongodb.DBRef
module.exports.Double = mongodb.Double
module.exports.Long = mongodb.Long
module.exports.NumberLong = mongodb.Long // Alias for shell compatibility
module.exports.MinKey = mongodb.MinKey
module.exports.MaxKey = mongodb.MaxKey
module.exports.ObjectID = mongodb.ObjectID
module.exports.ObjectId = mongodb.ObjectId
module.exports.Symbol = mongodb.Symbol
module.exports.Timestamp = mongodb.Timestamp
