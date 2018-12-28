/**
 * promisify(fn, cb)
 *
 * A progressive promisifier. Wraps an async code block which normally takes a callback, and allows
 * instead returning a promise when no callback is passed in.
 *
 * fn - function which accepts a callback
 * cb - a callback to use when the wrapped code finishes, omitting this, promisify returns a Promise.
 */
module.exports = function (fn, cb) {
  if (cb === module.exports.noop || !cb) {
    var promise = new Promise(function (resolve, reject) {
      let cbp = (err, result) => {
        promise._done = true // just for testing.
        if (err) reject(err)
        resolve(result)
      }
      fn(cbp)
    })
    return promise
  } else {
    return fn(cb)
  }
}

module.exports.noop = function () { }
