var insert = require('./insert');

insert('find cursor', [{
  hello:'world1'
},{
  hello:'world2'
}], function(db, t, done) {
  var cursor = db.a.find();
  var runs = 0;

  cursor.next(function loop(err, doc) {
    if (!doc) {
      t.equal(runs, 2);
      done();
      return;
    }
    t.ok(!err);
    t.ok(doc.hello === 'world1' || doc.hello === 'world2');
    t.equal(typeof doc, 'object');
    runs++;
    cursor.next(loop);
  });
});
