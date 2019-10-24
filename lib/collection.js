const mongodb = require('mongodb')
const once = require('once')
const Cursor = require('./cursor')
const Bulk = require('./bulk')

const noop = function () {}
const oid = mongodb.ObjectID.createPk

class Collection {
  constructor (opts, getConnection) {
    this._name = opts.name
    this._writeOpts = opts.writeOpts
    this._getConnection = getConnection
    this._getCollection = (cb) => {
      const collectionName = this._name

      this._getConnection((err, connection) => err ? cb(err) : cb(null, connection.collection(collectionName)))
    }
  }

  find (query, projection, opts, cb) {
    if (typeof query === 'function') return this.find({}, null, null, query)
    if (typeof projection === 'function') return this.find(query, null, null, projection)
    if (typeof opts === 'function') return this.find(query, projection, null, opts)

    const getCursor = (cb) => {
      this._getCollection((err, collection) => {
        if (err) { return cb(err) }

        // projection is now an option on find
        if (projection) {
          if (opts) opts.projection = projection
          else opts = { projection: projection }
        }
        cb(null, collection.find(query, opts))
      })
    }

    const cursor = new Cursor(getCursor)

    if (cb) return cursor.toArray(cb)
    return cursor
  }

  findOne (query, projection, cb) {
    if (typeof query === 'function') return this.findOne({}, null, query)
    if (typeof projection === 'function') return this.findOne(query, null, projection)
    this.find(query, projection).next((err, doc) => {
      if (err) return cb(err)
      cb(null, doc)
    })
  }

  findAndModify (opts, cb) {
    this.runCommand('findAndModify', opts, (err, result) => {
      if (err) return cb(err)
      cb(null, result.value, result.lastErrorObject || { n: 0 })
    })
  }

  count (query, cb) {
    if (typeof query === 'function') return this.count({}, query)
    this.find(query).count(cb)
  }

  distinct (field, query, cb) {
    this.runCommand('distinct', { key: field, query: query }, (err, result) => {
      if (err) return cb(err)
      cb(null, result.values)
    })
  }

  insert (docOrDocs, opts, cb) {
    if (Array.isArray(docOrDocs)) {
      this.insertMany(docOrDocs, opts, cb)
    } else {
      this.insertOne(docOrDocs, opts, cb)
    }
  }

  insertOne (doc, opts, cb) {
    if (!opts && !cb) return this.insertOne(doc, {}, noop)
    if (typeof opts === 'function') return this.insertOne(doc, {}, opts)
    if (opts && !cb) return this.insertOne(doc, opts, noop)

    this._getCollection((err, collection) => {
      if (err) return cb(err)

      doc._id = doc._id || oid()

      collection.insertOne(doc, xtend(this._writeOpts, opts), (err) => {
        if (err) return cb(err)
        // TODO: Add a test for this - is this really not needed anymore?
        // if (res && res.result && res.result.writeErrors && res.result.writeErrors.length > 0) return cb(res.result.writeErrors[0])
        cb(null, doc)
      })
    })
  }

  insertMany (docs, opts, cb) {
    if (!opts && !cb) return this.insert(docs, {}, noop)
    if (typeof opts === 'function') return this.insert(docs, {}, opts)
    if (opts && !cb) return this.insert(docs, opts, noop)

    this._getCollection((err, collection) => {
      if (err) return cb(err)

      for (let i = 0; i < docs.length; i++) {
        if (!docs[i]._id) docs[i]._id = oid()
      }

      collection.insertMany(docs, xtend(this._writeOpts, opts), (err) => {
        if (err) return cb(err)
        // TODO: Add a test for this - is this really not needed anymore?
        // if (res && res.result && res.result.writeErrors && res.result.writeErrors.length > 0) return cb(res.result.writeErrors[0])
        cb(null, docs)
      })
    })
  }

  update (query, update, opts, cb) {
    if (!opts && !cb) return this.update(query, update, {}, noop)
    if (typeof opts === 'function') return this.update(query, update, {}, opts)

    if (opts.multi) {
      this.updateMany(query, update, opts, cb)
    } else {
      this.updateOne(query, update, opts, cb)
    }
  }

  updateOne (query, update, opts, cb) {
    if (!opts && !cb) return this.updateOne(query, update, {}, noop)
    if (typeof opts === 'function') return this.updateOne(query, update, {}, opts)

    cb = cb || noop
    this._getCollection((err, collection) => {
      if (err) return cb(err)

      collection.updateOne(query, update, xtend(this._writeOpts, opts), (err, result) => {
        if (err) { return cb(err) }
        cb(null, result.result)
      })
    })
  }

  updateMany (query, update, opts, cb) {
    if (!opts && !cb) return this.updateMany(query, update, {}, noop)
    if (typeof opts === 'function') return this.updateMany(query, update, {}, opts)

    cb = cb || noop
    this._getCollection((err, collection) => {
      if (err) return cb(err)

      collection.updateMany(query, update, xtend(this._writeOpts, opts), (err, result) => {
        if (err) { return cb(err) }
        cb(null, result.result)
      })
    })
  }

  save (doc, opts, cb) {
    if (!opts && !cb) return this.save(doc, {}, noop)
    if (typeof opts === 'function') return this.save(doc, {}, opts)
    if (!cb) return this.save(doc, opts, noop)

    if (doc._id) {
      this.updateOne({ _id: doc._id }, { $set: doc }, xtend({ upsert: true }, opts), (err) => {
        if (err) return cb(err)
        cb(null, doc)
      })
    } else {
      this.insert(doc, opts, cb)
    }
  }

  remove (query, opts, cb) {
    if (typeof query === 'function') return this.remove({}, { justOne: false }, query)
    if (typeof opts === 'function') return this.remove(query, { justOne: false }, opts)
    if (typeof opts === 'boolean') return this.remove(query, { justOne: opts }, cb)
    if (!opts) return this.remove(query, { justOne: false }, cb)
    if (!cb) return this.remove(query, opts, noop)

    this._getCollection((err, collection) => {
      if (err) return cb(err)

      const deleteOperation = opts.justOne ? 'deleteOne' : 'deleteMany'

      collection[deleteOperation](query, xtend(this._writeOpts, opts), (err, result) => {
        if (err) return cb(err)
        result.result.deletedCount = result.deletedCount
        cb(null, result.result)
      })
    })
  }

  rename (name, opts, cb) {
    if (typeof opts === 'function') return this.rename(name, {}, opts)
    if (!opts) return this.rename(name, {}, noop)
    if (!cb) return this.rename(name, noop)

    this._getCollection((err, collection) => {
      if (err) return cb(err)
      collection.rename(name, opts, cb)
    })
  }

  drop (cb) {
    this.runCommand('drop', cb)
  }

  stats (cb) {
    this.runCommand('collStats', cb)
  }

  mapReduce (map, reduce, opts, cb) {
    if (typeof opts === 'function') { return this.mapReduce(map, reduce, {}, opts) }
    if (!cb) { return this.mapReduce(map, reduce, opts, noop) }

    this._getCollection((err, collection) => {
      if (err) return cb(err)

      collection.mapReduce(map, reduce, opts, cb)
    })
  }

  runCommand (cmd, opts, cb) {
    if (typeof opts === 'function') return this.runCommand(cmd, null, opts)
    opts = opts || {}

    const cmdObject = {}
    cmdObject[cmd] = this._name
    Object.keys(opts).forEach((key) => {
      cmdObject[key] = opts[key]
    })
    this._getConnection((err, connection) => {
      if (err) return cb(err)
      connection.command(cmdObject, cb)
    })
  }

  toString () {
    return this._name
  }

  dropIndexes (cb) {
    this.runCommand('dropIndexes', { index: '*' }, cb)
  }

  dropIndex (index, cb) {
    this.runCommand('dropIndexes', { index: index }, cb)
  }

  createIndex (index, opts, cb) {
    if (typeof opts === 'function') return this.createIndex(index, {}, opts)
    if (!opts) return this.createIndex(index, {}, noop)
    if (!cb) return this.createIndex(index, opts, noop)

    this._getCollection((err, collection) => {
      if (err) return cb(err)

      collection.createIndex(index, opts, cb)
    })
  }

  ensureIndex (index, opts, cb) {
    if (typeof opts === 'function') return this.ensureIndex(index, {}, opts)
    if (!opts) return this.ensureIndex(index, {}, noop)
    if (!cb) return this.ensureIndex(index, opts, noop)

    this._getCollection((err, collection) => {
      if (err) return cb(err)

      collection.ensureIndex(index, opts, cb)
    })
  }

  getIndexes (cb) {
    this._getCollection((err, collection) => {
      if (err) { return cb(err) }

      collection.indexes(cb)
    })
  }

  reIndex (cb) {
    this.runCommand('reIndex', cb)
  }

  isCapped (cb) {
    this._getCollection((err, collection) => {
      if (err) { return cb(err) }

      collection.isCapped(cb)
    })
  }

  group (doc, cb) {
    this._getCollection((err, collection) => {
      if (err) return cb(err)
      collection.group(doc.key || doc.keyf, doc.cond, doc.initial, doc.reduce, doc.finalize, cb)
    })
  }

  aggregate () {
    let cb
    let opts

    let pipeline = Array.prototype.slice.call(arguments)
    if (typeof pipeline[pipeline.length - 1] === 'function') {
      cb = once(pipeline.pop())
    }

    if ((pipeline.length === 1 || pipeline.length === 2) && Array.isArray(pipeline[0])) {
      opts = pipeline[1]
      pipeline = pipeline[0]
    }

    const strm = new Cursor((cb) => {
      this._getCollection((err, collection) => {
        if (err) return cb(err)

        cb(null, collection.aggregate(pipeline, opts))
      })
    })

    if (cb) {
      return strm.toArray(cb)
    }

    return strm
  }

  initializeOrderedBulkOp (opts) {
    return new Bulk(this._name, true, this._getConnection, this._dbname, opts)
  }

  initializeUnorderedBulkOp (opts) {
    return new Bulk(this._name, false, this._getConnection, this._dbname, opts)
  }
}

function xtend (obj, ext) {
  return Object.assign({}, obj, ext)
}

module.exports = Collection
