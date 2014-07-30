var insert = require('./insert');

insert('find and select', [{
  hello:'world',
  another:'value'
}], function(db, t, done) {
  db.a.find({}, {another:1}, function(err, docs) {
    t.ok(!err);
    t.equal(docs.length, 1);
    t.equal(docs[0].hello, undefined);
    t.equal(docs[0].another, 'value');
    done();
  });
});
