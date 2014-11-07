var insert = require('./insert');
var concat = require('concat-stream');

insert('aggregate', [{
  name:'Squirtle', type:'water'
}, {
  name:'Starmie' , type:'water'
}, {
  name:'Charmander' , type:'fire'
}, {
  name:'Lapras'  , type:'water'
}], function(db, t, done) {
  db.a.aggregate({$group: {_id: '$type'}}, function(err, types) {
    var arr = types.map(function(x) {return x._id});
    t.equal(types.length, 2);
    t.notEqual(arr.indexOf('fire'), -1);
    t.notEqual(arr.indexOf('water'), -1);

    // test as a stream
    db.a.aggregate({$group: {_id: '$type'}}).pipe(concat(function(types) {
      var arr = types.map(function(x) {return x._id});
      t.equal(types.length, 2);
      t.notEqual(arr.indexOf('fire'), -1);
      t.notEqual(arr.indexOf('water'), -1);
      t.end();
    }));
  });
});
