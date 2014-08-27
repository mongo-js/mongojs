var test = require('./tape');
var mongojs = require('../index');
var db = mongojs('test', ['a','b']);

test('insert', function(t) {
  db.a.insert([{name: "Squirtle"}, {name: "Charmander"}, {name: "Bulbasaur"}], function(err, docs) {
    t.ok(docs[0]._id);
    t.ok(docs[1]._id);
    t.ok(docs[2]._id);

    // It should only return one document in the 
    // callback when one document is passed instead of an array
    db.a.insert({name: "Lapras"}, function(err, doc) {
      t.equal(doc.name, "Lapras");

      // If you pass a one element array the callback should
      // have a one element array
      db.a.insert([{name: "Pidgeotto"}], function (err, docs) {
        t.equal(docs[0].name, "Pidgeotto");
        t.equal(docs.length, 1);
        db.a.remove(function() {
          db.close(t.end.bind(t));
        });
      });
    });
  });
});
