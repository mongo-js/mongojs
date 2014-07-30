var insert = require('./insert');

insert('find().limit', [{
  hello:'world'
}], function(db, t, done) {
  db.a.find().limit(1, function(err, docs) {
    t.ok(!err);
    t.equal(docs.length, 1);
    t.equal(docs[0].hello, 'world');
    done();
  });
});
