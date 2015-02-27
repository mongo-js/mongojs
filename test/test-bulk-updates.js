var insert = require('./insert');

insert('bulk', [{
  name:'Squirtle', type:'water'
}, {
  name:'Starmie' , type:'water'
}, {
  name:'Lapras'  , type:'water'
}, {
  name: 'Charmander', type: 'fire'
}], function(db, t, done) {
  db.runCommand('serverStatus', function(err, resp) {
    if (err) return t.fail();
    if (parseFloat(resp.version) < 2.6) return t.end();

    var bulk = db.a.initializeOrderedBulkOp();
    bulk.find({type: 'water'}).update({$set: {level: 1}});
    bulk.find({type: 'water'}).update({$inc: {level: 2}});
    bulk.insert({name: 'Spearow', type: 'flying'});
    bulk.insert({name: 'Pidgeotto', type: 'flying'});
    bulk.insert({name: 'Charmeleon', type: 'fire'});
    bulk.find({type: 'flying'}).removeOne();
    bulk.find({type: 'fire'}).remove();
    bulk.find({type: 'water'}).updateOne({$set: {hp: 100}});

    bulk.execute(function(err, res) {
      t.ok(res.ok);
      db.a.find(function(err, res) {
        t.equal(res[0].name, 'Squirtle');
        t.equal(res[1].name, 'Starmie');
        t.equal(res[2].name, 'Lapras');
        t.equal(res[3].name, 'Pidgeotto');

        t.equal(res[0].level, 3);
        t.equal(res[1].level, 3);
        t.equal(res[2].level, 3);

        t.equal(res[0].hp, 100);
        t.end();
      });
    });
  });
});
