var util = require('util')
var thunky = require('thunky')
var Cursor = require('./cursor')

var AggregationCursor = function (opts) {
  Cursor.call(this, opts)
  var onserver = this._opts.onserver

  var self = this
  this._get = thunky(function (cb) {
    onserver(function (err, server) {
      if (err) return cb(err)
      cb(null, server.cursor(self._opts.fullCollectionName, {
        aggregate: self._opts.colName,
        pipeline: self._opts.pipeline,
        cursor: {batchSize: 1000}
      }, {cursor: {batchSize: 1000}}))
    })
  })
}

util.inherits(AggregationCursor, Cursor)

module.exports = AggregationCursor
