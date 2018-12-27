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
