var Database = require('./lib/database')
var mongodb = require('mongodb')
var xtend = require('xtend')

module.exports = function (connString, cols, options) {
  var db = new Database(xtend({connString: connString, cols: cols}, options))
  if (typeof Proxy !== 'undefined') {
    var p = Proxy.create({
      get: function (obj, prop) {
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
module.exports.MinKey = mongodb.MinKey
module.exports.MaxKey = mongodb.MaxKey
module.exports.ObjectID = mongodb.ObjectID
module.exports.ObjectId = mongodb.ObjectId
module.exports.Symbol = mongodb.Symbol
module.exports.Timestamp = mongodb.Timestamp
