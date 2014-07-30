var insert = require('./insert');

insert('cursor.map', [{
  hello:'world1'
},{
  hello:'world2'
}], function(db, t, done) {
  var cursor = db.a.find();
  cursor.map(function(x) { 
    return x.hello 
  }, function(err, res) {
    t.equal(res[0], 'world1');
    t.equal(res[1], 'world2');
    done();
  });
});

