var Database = require('./lib/database')
var bson = require('mongodb-core').BSON
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
module.exports.ObjectId = bson.ObjectId
module.exports.DBRef = bson.DBRef
module.exports.Timestamp = bson.Timestamp
module.exports.MinKey = bson.MinKey
module.exports.MaxKey = bson.MaxKey
module.exports.NumberLong = bson.Long
