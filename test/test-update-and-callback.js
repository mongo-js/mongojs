var insert = require('./insert');

insert('update and callback', [{
  hello:'world'
}], function(db, t, done) {
  var sync = true;
  db.a.update({hello:'world'}, {$set:{hello:'verden'}}, function(err, lastErrorObject) {
    t.ok(!sync);
    t.ok(!err);
    t.equal(lastErrorObject.updatedExisting, true);
    t.equal(lastErrorObject.n, 1);

    done();
  });
  sync = false;
});
