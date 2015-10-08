var mongodb = require('mongodb')
var once = require('once')
var xtend = require('xtend')
var Cursor = require('./cursor')
var AggregationCursor = require('./aggregation-cursor')
var Bulk = require('./bulk')

var writeOpts = {writeConcern: {w: 1}, ordered: true}
var noop = function () {}
var oid = mongodb.ObjectID.createPk
var Code = mongodb.Code

var indexName = function (index) {
  return Object.keys(index).map(function (key) {
    return key + '_' + index[key]
  }).join('_')
}
// TODO: Use drive functionality where possible and don't hit command interface
var Collection = function (opts, getConnection) {
  this._name = opts.name
  this._getConnection = getConnection
}

Collection.prototype._fullColName = function () {
  return this._name
}

Collection.prototype.find = function (query, projection, opts, cb) {
  if (typeof query === 'function') return this.find({}, null, null, query)
  if (typeof projection === 'function') return this.find(query, null, null, projection)
  if (typeof opts === 'function') return this.find(query, projection, null, opts)

  var self = this
  function getCursor (cb) {
    self._getConnection(function (err, connection) {
      if (err) { return cb(err) }

      cb(null, connection.collection(self._fullColName()).find(query, projection, opts))
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
    cb(null, result.value, result.lastErrorObject || {n: 0})
  })
}

Collection.prototype.count = function (query, cb) {
  if (typeof query === 'function') return this.count({}, query)
  this.find(query).count(cb)
}

Collection.prototype.distinct = function (field, query, cb) {
  this.runCommand('distinct', {key: field, query: query}, function (err, result) {
    if (err) return cb(err)
    cb(null, result.values)
  })
}

Collection.prototype.insert = function (docOrDocs, opts, cb) {
  // TODO: Check this signature correction algorithm again
  if (!opts && !cb) return this.insert(docOrDocs, {}, noop)
  if (typeof opts === 'function') return this.insert(docOrDocs, {}, opts)

  var self = this
  this._getConnection(function (err, connection) {
    if (err) return cb(err)

    var docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs]
    for (var i = 0; i < docs.length; i++) {
      if (!docs[i]._id) docs[i]._id = oid()
    }

    connection.collection(self._fullColName()).insert(docs, xtend(writeOpts, opts), function (err, res) {
      if (err) return cb(err)
      // TODO: Add a test for this - is this really not needed anymore?
      //if (res && res.result && res.result.writeErrors && res.result.writeErrors.length > 0) return cb(res.result.writeErrors[0])
      cb(null, docOrDocs)
    })
  })
}

Collection.prototype.update = function (query, update, opts, cb) {
  if (!opts && !cb) return this.update(query, update, {}, noop)
  if (typeof opts === 'function') return this.update(query, update, {}, opts)

  cb = cb || noop
  var self = this
  this._getConnection(function (err, connection) {
    if (err) return cb(err)

    connection.collection(self._fullColName()).update(query, update, opts, cb)
  })
}

Collection.prototype.save = function (doc, cb) {
  cb = cb || noop
  if (doc._id) {
    this.update({_id: doc._id}, doc, {upsert: true}, function (err) {
      if (err) return cb(err)
      cb(null, doc)
    })
  } else {
    this.insert(doc, cb)
  }
}

Collection.prototype.remove = function (query, options, cb) {
  if (typeof query === 'function') return this.remove({}, { justOne : false }, query)
  if (typeof options === 'function') return this.remove(query, { justOne : false }, options)
  if (typeof options === 'boolean') return this.remove(query, { justOne : options }, cb)

  var self = this
  this._getConnection(function (err, connection) {
    if (err) return cb(err)

    var collection = connection.collection(self._fullColName())
    // TODO: Duplicate code - see xtend below
    if (options.justOne) {
      collection.deleteOne(query, xtend(writeOpts, options), cb)
    } else {
      collection.deleteMany(query, xtend(writeOpts, options), cb)
    }
  })
}

Collection.prototype.drop = function (cb) {
  this.runCommand('drop', cb)
}

Collection.prototype.stats = function (cb) {
  this.runCommand('collStats', cb)
}

Collection.prototype.mapReduce = function (map, reduce, opts, cb) {
  this.runCommand('mapReduce', {
    map: map.toString(),
    reduce: reduce.toString(),
    query: opts.query || {},
    out: opts.out
  }, cb)
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
  this.runCommand('dropIndexes', {index: '*'}, cb)
}

Collection.prototype.dropIndex = function (index, cb) {
  this.runCommand('dropIndexes', {index: index}, cb)
}

Collection.prototype.createIndex = function (index, opts, cb) {
  if (typeof opts === 'function') return this.createIndex(index, {}, opts)
  if (typeof opts === 'undefined') return this.createIndex(index, {}, noop)
  if (typeof cb === 'undefined') return this.createIndex(index, opts, noop)

  opts.name = indexName(index)
  opts.key = index
  this.runCommand('createIndexes', {indexes: [opts]}, cb)
}

Collection.prototype.ensureIndex = function (index, opts, cb) {
  this.createIndex(index, opts, cb)
}

Collection.prototype.getIndexes = function (cb) {
  var self = this
  this._getConnection(function (err, connection) {
    connection.collection(self._fullColName()).indexes(cb)
  })
}

Collection.prototype.reIndex = function (cb) {
  this.runCommand('reIndex', cb)
}

Collection.prototype.isCapped = function (cb) {
  var self = this
  this._getConnection(function (err, connection) {
    if (err) { return cb(err) }

    connection.collection(self._fullColName()).isCapped(cb)
  })
}

Collection.prototype.group = function (doc, cb) {
  var self = this
  this._getConnection(function (err, connection) {
    if (err) return cb(err)
    connection.collection(self._fullColName()).group(doc.key || doc.keyf, doc.cond, doc.initial, doc.reduce, doc.finalize, cb)
  })
}

Collection.prototype.aggregate = function () {
  var cb
  var pipeline = Array.prototype.slice.call(arguments)
  if (typeof pipeline[pipeline.length - 1] === 'function') {
    cb = once(pipeline.pop())
  }

  if (pipeline.length === 1 && Array.isArray(pipeline[0])) {
    pipeline = pipeline[0]
  }

  if (cb) {
    this.runCommand('aggregate', {pipeline: pipeline}, function (err, res) {
      if (err) return cb(err)
      cb(null, res.result)
    })
    return
  }
  var strm = new AggregationCursor({
    onserver: this._getConnection,
    colName: this._name,
    fullCollectionName: this._fullColName(),
    pipeline: pipeline
  })

  return strm
}

Collection.prototype.initializeOrderedBulkOp = function () {
  return new Bulk(this._name, true, this._getConnection, this._dbname)
}

Collection.prototype.initializeUnorderedBulkOp = function () {
  return new Bulk(this._name, false, this._getConnection, this._dbname)
}

module.exports = Collection
