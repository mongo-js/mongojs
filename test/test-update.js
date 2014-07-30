var insert = require('./insert');

insert('update', [{
  hello:'world'
}], function(db, t, done) {
  db.a.update({hello:'world'}, {$set:{hello:'verden'}}, function(err, lastErrorObject) {
    t.ok(!err);
    t.equal(lastErrorObject.updatedExisting, true);
    t.equal(lastErrorObject.n, 1);

    db.a.findOne(function(err, doc) {
      t.ok(!err);
      t.equal(doc.hello, 'verden');
      done();
    });
  });
});
