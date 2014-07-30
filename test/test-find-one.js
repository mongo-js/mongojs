var insert = require('./insert');

insert('findOne', [{
  hello:'world1'
},{
  hello:'world2'
}], function(db, t, done) {
  db.a.findOne(function(err, doc) {
    t.ok(!err);
    t.equal(typeof doc, 'object');
    t.ok(doc.hello === 'world1' || doc.hello === 'world2');
    done();
  });
});
