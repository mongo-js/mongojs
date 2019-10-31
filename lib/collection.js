var mongodb = require('mongodb')
var once = require('once')
var Cursor = require('./cursor')
var Bulk = require('./bulk')

// TODO: Make this configurable by users
var writeOpts = { writeConcern: { w: 1 }, ordered: true }
var noop = function () {}
var oid = mongodb.ObjectID.createPk

var Collection = function (opts, getConnection) {
  this._name = opts.name
  this._getConnection = getConnection
  this._getCollection = function (cb) {
    var collectionName = this._name

    this._getConnection(function (err, connection) {
      if (err) { return cb(err) }

      cb(null, connection.collection(collectionName))
    })
  }
}

Collection.prototype.find = function (query, projection, opts, cb) {
  if (typeof query === 'function') return this.find({}, null, null, query)
  if (typeof projection === 'function') return this.find(query, null, null, projection)
  if (typeof opts === 'function') return this.find(query, projection, null, opts)

  var self = this
  function getCursor (cb) {
    self._getCollection(function (err, collection) {
      if (err) { return cb(err) }

      // projection is now an option on find
      if (projection) {
        if (opts) opts.projection = projection
        else opts = { projection: projection }
      }
      cb(null, collection.find(query, opts))
    })
  }

  var cursor = new Cursor(getCursor)

  if (cb) return cursor.toArray(cb)
  return cursor
}

Collection.prototype.findOne = function (query, projection, cb) {
  if (typeof query === 'function') return this.findOne({}, null, query)
  if (typeof projection === 'function') return this.findOne(query, null, projection)
  this.find(query, projection).next(function (err, doc) {
    if (err) return cb(err)
    cb(null, doc)
  })
}

Collection.prototype.findAndModify = function (opts, cb) {
  this.runCommand('findAndModify', opts, function (err, result) {
    if (err) return cb(err)
    cb(null, result.value, result.lastErrorObject || { n: 0 })
  })
}

Collection.prototype.count = function (query, cb) {
  if (typeof query === 'function') return this.count({}, query)
  this.find(query).count(cb)
}

Collection.prototype.distinct = function (field, query, cb) {
  this.runCommand('distinct', { key: field, query: query }, function (err, result) {
    if (err) return cb(err)
    cb(null, result.values)
  })
}

Collection.prototype.insert = function (docOrDocs, opts, cb) {
  if (Array.isArray(docOrDocs)) {
    this.insertMany(docOrDocs, opts, cb)
  } else {
    this.insertOne(docOrDocs, opts, cb)
  }
}

Collection.prototype.insertOne = function (doc, opts, cb) {
  if (!opts && !cb) return this.insertOne(doc, {}, noop)
  if (typeof opts === 'function') return this.insertOne(doc, {}, opts)
  if (opts && !cb) return this.insertOne(doc, opts, noop)

  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    doc._id = doc._id || oid()

    collection.insertOne(doc, xtend(writeOpts, opts), function (err) {
      if (err) return cb(err)
      // TODO: Add a test for this - is this really not needed anymore?
      // if (res && res.result && res.result.writeErrors && res.result.writeErrors.length > 0) return cb(res.result.writeErrors[0])
      cb(null, doc)
    })
  })
}

Collection.prototype.insertMany = function (docs, opts, cb) {
  if (!opts && !cb) return this.insert(docs, {}, noop)
  if (typeof opts === 'function') return this.insert(docs, {}, opts)
  if (opts && !cb) return this.insert(docs, opts, noop)

  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    for (var i = 0; i < docs.length; i++) {
      if (!docs[i]._id) docs[i]._id = oid()
    }

    collection.insertMany(docs, xtend(writeOpts, opts), function (err) {
      if (err) return cb(err)
      // TODO: Add a test for this - is this really not needed anymore?
      // if (res && res.result && res.result.writeErrors && res.result.writeErrors.length > 0) return cb(res.result.writeErrors[0])
      cb(null, docs)
    })
  })
}

Collection.prototype.update = function (query, update, opts, cb) {
  if (!opts && !cb) return this.update(query, update, {}, noop)
  if (typeof opts === 'function') return this.update(query, update, {}, opts)

  if (opts.multi) {
    this.updateMany(query, update, opts, cb)
  } else {
    this.updateOne(query, update, opts, cb)
  }
}

Collection.prototype.updateOne = function (query, update, opts, cb) {
  if (!opts && !cb) return this.updateOne(query, update, {}, noop)
  if (typeof opts === 'function') return this.updateOne(query, update, {}, opts)

  cb = cb || noop
  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    collection.updateOne(query, update, xtend(writeOpts, opts), function (err, result) {
      if (err) { return cb(err) }
      cb(null, result.result)
    })
  })
}

Collection.prototype.updateMany = function (query, update, opts, cb) {
  if (!opts && !cb) return this.updateMany(query, update, {}, noop)
  if (typeof opts === 'function') return this.updateMany(query, update, {}, opts)

  cb = cb || noop
  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    collection.updateMany(query, update, xtend(writeOpts, opts), function (err, result) {
      if (err) { return cb(err) }
      cb(null, result.result)
    })
  })
}

Collection.prototype.save = function (doc, opts, cb) {
  if (!opts && !cb) return this.save(doc, {}, noop)
  if (typeof opts === 'function') return this.save(doc, {}, opts)
  if (!cb) return this.save(doc, opts, noop)

  if (doc._id) {
    this.replaceOne({ _id: doc._id }, doc, xtend({ upsert: true }, opts), function (err) {
      if (err) return cb(err)
      cb(null, doc)
    })
  } else {
    this.insert(doc, opts, cb)
  }
}

Collection.prototype.replaceOne = function (query, update, opts, cb) {
  if (!opts && !cb) return this.replaceOne(query, update, {}, noop)
  if (typeof opts === 'function') return this.replaceOne(query, update, {}, opts)

  cb = cb || noop
  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    collection.replaceOne(query, update, xtend(writeOpts, opts), function (err, result) {
      if (err) { return cb(err) }
      cb(null, result.result)
    })
  })
}

Collection.prototype.remove = function (query, opts, cb) {
  if (typeof query === 'function') return this.remove({}, { justOne: false }, query)
  if (typeof opts === 'function') return this.remove(query, { justOne: false }, opts)
  if (typeof opts === 'boolean') return this.remove(query, { justOne: opts }, cb)
  if (!opts) return this.remove(query, { justOne: false }, cb)
  if (!cb) return this.remove(query, opts, noop)

  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    var deleteOperation = opts.justOne ? 'deleteOne' : 'deleteMany'

    collection[deleteOperation](query, xtend(writeOpts, opts), function (err, result) {
      if (err) return cb(err)
      result.result.deletedCount = result.deletedCount
      cb(null, result.result)
    })
  })
}

Collection.prototype.rename = function (name, opts, cb) {
  if (typeof opts === 'function') return this.rename(name, {}, opts)
  if (!opts) return this.rename(name, {}, noop)
  if (!cb) return this.rename(name, noop)

  this._getCollection(function (err, collection) {
    if (err) return cb(err)
    collection.rename(name, opts, cb)
  })
}

Collection.prototype.drop = function (cb) {
  this.runCommand('drop', cb)
}

Collection.prototype.stats = function (cb) {
  this.runCommand('collStats', cb)
}

Collection.prototype.mapReduce = function (map, reduce, opts, cb) {
  if (typeof opts === 'function') { return this.mapReduce(map, reduce, {}, opts) }
  if (!cb) { return this.mapReduce(map, reduce, opts, noop) }

  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    collection.mapReduce(map, reduce, opts, cb)
  })
}

Collection.prototype.runCommand = function (cmd, opts, cb) {
  if (typeof opts === 'function') return this.runCommand(cmd, null, opts)
  opts = opts || {}

  var cmdObject = {}
  cmdObject[cmd] = this._name
  Object.keys(opts).forEach(function (key) {
    cmdObject[key] = opts[key]
  })
  this._getConnection(function (err, connection) {
    if (err) return cb(err)
    connection.command(cmdObject, cb)
  })
}

Collection.prototype.toString = function () {
  return this._name
}

Collection.prototype.dropIndexes = function (cb) {
  this.runCommand('dropIndexes', { index: '*' }, cb)
}

Collection.prototype.dropIndex = function (index, cb) {
  this.runCommand('dropIndexes', { index: index }, cb)
}

Collection.prototype.createIndex = function (index, opts, cb) {
  if (typeof opts === 'function') return this.createIndex(index, {}, opts)
  if (!opts) return this.createIndex(index, {}, noop)
  if (!cb) return this.createIndex(index, opts, noop)

  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    collection.createIndex(index, opts, cb)
  })
}

Collection.prototype.ensureIndex = function (index, opts, cb) {
  if (typeof opts === 'function') return this.ensureIndex(index, {}, opts)
  if (!opts) return this.ensureIndex(index, {}, noop)
  if (!cb) return this.ensureIndex(index, opts, noop)

  this._getCollection(function (err, collection) {
    if (err) return cb(err)

    collection.ensureIndex(index, opts, cb)
  })
}

Collection.prototype.getIndexes = function (cb) {
  this._getCollection(function (err, collection) {
    if (err) { return cb(err) }

    collection.indexes(cb)
  })
}

Collection.prototype.reIndex = function (cb) {
  this.runCommand('reIndex', cb)
}

Collection.prototype.isCapped = function (cb) {
  this._getCollection(function (err, collection) {
    if (err) { return cb(err) }

    collection.isCapped(cb)
  })
}

Collection.prototype.group = function (doc, cb) {
  this._getCollection(function (err, collection) {
    if (err) return cb(err)
    collection.group(doc.key || doc.keyf, doc.cond, doc.initial, doc.reduce, doc.finalize, cb)
  })
}

Collection.prototype.aggregate = function () {
  var cb
  var opts

  var pipeline = Array.prototype.slice.call(arguments)
  if (typeof pipeline[pipeline.length - 1] === 'function') {
    cb = once(pipeline.pop())
  }

  if ((pipeline.length === 1 || pipeline.length === 2) && Array.isArray(pipeline[0])) {
    opts = pipeline[1]
    pipeline = pipeline[0]
  }

  var self = this

  var strm = new Cursor(function (cb) {
    self._getCollection(function (err, collection) {
      if (err) return cb(err)

      cb(null, collection.aggregate(pipeline, opts))
    })
  })

  if (cb) {
    return strm.toArray(cb)
  }

  return strm
}

Collection.prototype.initializeOrderedBulkOp = function (opts) {
  return new Bulk(this._name, true, this._getConnection, this._dbname, opts)
}

Collection.prototype.initializeUnorderedBulkOp = function (opts) {
  return new Bulk(this._name, false, this._getConnection, this._dbname, opts)
}

function xtend (obj, ext) {
  return Object.assign({}, obj, ext)
}

module.exports = Collection
