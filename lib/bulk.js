const mongodb = require('mongodb')
const each = require('each-series')
const maxBulkSize = 1000

const noop = function () {}
const oid = mongodb.ObjectID.createPk

class Bulk {
  constructor (colName, ordered, onserver, opts) {
    if (!opts) { return new Bulk(colName, ordered, onserver, { writeConcern: { w: 1 } }) }

    this._colname = colName
    this._cmds = []
    this._currCmd = null
    this._ordered = ordered
    this._getConnection = onserver

    this._writeConcern = opts.writeConcern

    this.find = (query) => {
      let upsert = false
      const findobj = {}
      const remove = (lim) => {
        if (!this._currCmd) {
          this._currCmd = {
            delete: this._colname,
            deletes: [],
            ordered: this._ordered,
            writeConcern: this._writeConcern
          }
        }

        if (!this._currCmd.delete || this._currCmd.deletes.length === maxBulkSize) {
          this._cmds.push(this._currCmd)
          this._currCmd = {
            delete: this._colname,
            deletes: [],
            ordered: this._ordered,
            writeConcern: this._writeConcern
          }
        }

        this._currCmd.deletes.push({ q: query, limit: lim })
      }

      const update = (updObj, multi) => {
        if (!this._currCmd) {
          this._currCmd = {
            update: this._colname,
            updates: [],
            ordered: this._ordered,
            writeConcern: this._writeConcern
          }
        }
        if (!this._currCmd.update || this._currCmd.updates.length === maxBulkSize) {
          this._cmds.push(this._currCmd)
          this._currCmd = {
            update: this._colname,
            updates: [],
            ordered: this._ordered,
            writeConcern: this._writeConcern
          }
        }
        this._currCmd.updates.push({ q: query, u: updObj, multi: multi, upsert: upsert })
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

  insert (doc) {
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

  tojson () {
    if (this._currCmd) this._cmds.push(this._currCmd)

    const obj = {
      nInsertOps: 0,
      nUpdateOps: 0,
      nRemoveOps: 0,
      nBatches: this._cmds.length
    }

    this._cmds.forEach((cmd) => {
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

  toString () {
    return JSON.stringify(this.tojson())
  }

  execute (cb) {
    if (!cb) return this.execute(noop)

    const result = {
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

    const cmdkeys = {
      insert: 'nInserted',
      delete: 'nRemoved',
      update: 'nUpserted'
    }

    this._getConnection((err, connection) => {
      if (err) return cb(err)
      each(this._cmds, (cmd, i, done) => {
        connection.command(cmd, (err, res) => {
          if (err) return done(err)
          result[cmdkeys[Object.keys(cmd)[0]]] += res.n
          done()
        })
      }, (err) => {
        if (err) return cb(err)
        result.ok = 1
        cb(null, result)
      })
    })
  }
}

module.exports = Bulk
