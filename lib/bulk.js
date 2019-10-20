var mongodb = require('mongodb')
var each = require('each-series')
var maxBulkSize = 1000

var noop = function () {}
var oid = mongodb.ObjectID.createPk

var Bulk = function (colName, ordered, onserver, opts) {
  if (!opts) { return new Bulk(colName, ordered, onserver, { writeConcern: { w: 1 } }) }

  this._colname = colName
  this._cmds = []
  this._currCmd = null
  this._ordered = ordered
  this._getConnection = onserver

  this._writeConcern = opts.writeConcern

  var self = this
  this.find = function (query) {
    var upsert = false
    var findobj = {}
    var remove = function (lim) {
      if (!self._currCmd) {
        self._currCmd = {
          delete: self._colname,
          deletes: [],
          ordered: self._ordered,
          writeConcern: self._writeConcern
        }
      }
      if (!self._currCmd.delete || self._currCmd.deletes.length === maxBulkSize) {
        self._cmds.push(self._currCmd)
        self._currCmd = {
          delete: self._colname,
          deletes: [],
          ordered: self._ordered,
          writeConcern: self._writeConcern
        }
      }
      self._currCmd.deletes.push({ q: query, limit: lim })
    }

    var update = function (updObj, multi) {
      if (!self._currCmd) {
        self._currCmd = {
          update: self._colname,
          updates: [],
          ordered: self._ordered,
          writeConcern: self._writeConcern
        }
      }
      if (!self._currCmd.update || self._currCmd.updates.length === maxBulkSize) {
        self._cmds.push(self._currCmd)
        self._currCmd = {
          update: self._colname,
          updates: [],
          ordered: self._ordered,
          writeConcern: self._writeConcern
        }
      }
      self._currCmd.updates.push({ q: query, u: updObj, multi: multi, upsert: upsert })
    }

    findobj.upsert = function () {
      upsert = true
      return findobj
    }

    findobj.remove = function () {
      remove(0)
    }

    findobj.removeOne = function () {
      remove(1)
    }

    findobj.update = function (updObj) {
      update(updObj, true)
    }

    findobj.updateOne = function (updObj) {
      update(updObj, false)
    }

    findobj.replaceOne = function (updObj) {
      this.updateOne(updObj)
    }

    return findobj
  }
}

Bulk.prototype.insert = function (doc) {
  if (!this._currCmd) {
    this._currCmd = {
      insert: this._colname,
      documents: [],
      ordered: this._ordered,
      writeConcern: this._writeConcern
    }
  }
  if (!this._currCmd.insert || this._currCmd.documents.length === maxBulkSize) {
    this._cmds.push(this._currCmd)
    this._currCmd = {
      insert: this._colname,
      documents: [],
      ordered: this._ordered,
      writeConcern: this._writeConcern
    }
  }
  if (!doc._id) doc._id = oid()
  this._currCmd.documents.push(doc)
}

var cmdkeys = {
  insert: 'nInserted',
  delete: 'nRemoved',
  update: 'nUpserted'
}

Bulk.prototype.tojson = function () {
  if (this._currCmd) this._cmds.push(this._currCmd)

  var obj = {
    nInsertOps: 0,
    nUpdateOps: 0,
    nRemoveOps: 0,
    nBatches: this._cmds.length
  }

  this._cmds.forEach(function (cmd) {
    if (cmd.update) {
      obj.nUpdateOps += cmd.updates.length
    } else if (cmd.insert) {
      obj.nInsertOps += cmd.documents.length
    } else if (cmd.delete) {
      obj.nRemoveOps += cmd.deletes.length
    }
  })

  return obj
}

Bulk.prototype.toString = function () {
  return JSON.stringify(this.tojson())
}

Bulk.prototype.execute = function (cb) {
  if (!cb) return this.execute(noop)

  var self = this
  var result = {
    writeErrors: [],
    writeConcernErrors: [],
    nInserted: 0,
    nUpserted: 0,
    nMatched: 0,
    nModified: 0,
    nRemoved: 0,
    upserted: []
  }

  if (this._currCmd) {
    this._cmds.push(this._currCmd)
  }

  this._getConnection(function (err, connection) {
    if (err) return cb(err)
    each(self._cmds, function (cmd, i, done) {
      connection.command(cmd, function (err, res) {
        if (err) return done(err)
        result[cmdkeys[Object.keys(cmd)[0]]] += res.n
        done()
      })
    }, function (err) {
      if (err) return cb(err)
      result.ok = 1
      cb(null, result)
    })
  })
}

module.exports = Bulk
