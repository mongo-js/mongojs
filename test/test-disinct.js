var test = require('./tape');
var insert = require('./insert');

insert('distinct', [{
  goodbye:'world',
  hello:'space'
}], function(db, t, done) {
  db.a.distinct('goodbye',{hello:'space'},function(err, docs) {
    t.ok(!err);
    t.equal(docs.length, 1);
    t.equal(docs[0], 'world');
    done();
  });
});
