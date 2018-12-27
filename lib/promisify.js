module.exports = function (fn, cb) {
  if (cb === module.exports.noop || !cb) {
    return new Promise(function (resolve, reject) {
      let cbp = function (err, result) {
        if (err) reject(err)
        resolve(result)
      }
      fn(cbp)
    })
  } else {
    return fn(cb)
  }
}

module.exports.noop = function () { }
