var insert = require('./insert');

insert('getCollectionNames', [{
  hello:'world'
}], function(db, t, done) {
  db.collection('b').save({hello: "world"}, function(err, b) {
    db.getCollectionNames(function(err, colNames) {
      t.notEqual(colNames.indexOf('a'), -1);
      t.notEqual(colNames.indexOf('b'), -1);
      done();
    });
  });
});
