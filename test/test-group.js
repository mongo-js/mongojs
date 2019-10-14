var insert = require('./insert')

insert('group', [{
  t: 242424,
  online: 1
}, {
  t: 4244,
  online: 0
}], function (db, t, done) {
  db.a.group({
    key: {},
    cond: { t: { $gte: 86400 } },
    initial: { count: 0, online: 0 },
    reduce: function (doc, out) {
      out.count++
      out.online += doc.online
    },
    finalize: function (out) {
      out.avgOnline = out.online / out.count
    }
  }, function (err, curOnline) {
    t.error(err)
    t.equal(curOnline[0].count, 1)
    t.equal(curOnline[0].online, 1)
    done()
  })
})
