var test = require('./tape');
var insert = require('./insert');

insert('cursor.explain', [{
  hello:'world1'
},{
  hello:'world2'
}], function(db, t, done) {
  var cursor = db.a.find();
  cursor.explain(function(err, result) {
    t.equal(result.nscannedObjects, 2);
    done();
  });
});
