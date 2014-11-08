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
  db.a.find().sort({name: 1}, function(err, docs) {
    t.ok(!err);
    t.equal(docs[0].name, 'Charmander');
    t.equal(docs[1].name, 'Lapras');
    t.equal(docs[2].name, 'Squirtle');
    t.equal(docs[3].name, 'Starmie');
    t.end();
  });
});
