var test = require('./tape');
var insert = require('./insert');

insert('remove', [{
  name:'Squirtle', type:'water', level: 10
}, {
  name:'Starmie' , type:'water', level: 8
}, {
  name:'Charmander' , type:'fire', level: 8
}, {
  name:'Lapras'  , type:'water', level: 12
}], function(db, t, done) {
  db.a.mapReduce(function() {
    emit(this.type, this.level);
  }, function(key, values) {
    return Array.sum(values);
  }, {
    query: {type: 'water'},
    out: 'levelSum'
  }, function(err) {
    t.notOk(err);
    db.collection('levelSum').findOne(function(err, res) {
      t.equal(res._id, 'water');
      t.equal(res.value, 30);
      db.collection('levelSum').drop(done);
    });
  });
});
