var insert = require('./insert');

insert('streaming cursor', [{
  hello:'world1'
},{
  hello:'world2'
}], function(db, t, done) {
  var cursor = db.a.find();
  var runs = 0;

  var loop = function() {
    var doc;

    while (doc = cursor.read()) {
      t.ok(doc.hello === 'world1' || doc.hello === 'world2');
      t.equal(typeof doc, 'object');
      runs++;
    }

    cursor.once('readable', loop);
  };

  cursor.on('end', function() {
    t.equal(runs, 2);
    done();
  });

  loop();
});
