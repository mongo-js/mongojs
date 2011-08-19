# mongojs
A [node.js](http://nodejs.org) module for mongodb, that emulates the mongodb API as much as possible. It wraps [mongodb-native](https://github.com/christkv/node-mongodb-native/).  
It is available through npm:

	npm install mongojs --mongodb:native

mongojs is very simple to use:

``` js
var db = require('mongojs').connect(databaseURL, [collections]);
```

Some examples of this could be:

``` js
// simple usage for a local db
var db = require('mongojs').connect('mydb', ['mycollection']);

// the db is on a remote server (the port default to mongo)
var db = require('mongojs').connect('example.com/mydb', ['mycollection']);

// we can also provide some credentials
var db = require('mongojs').connect('username:password@example.com/mydb', ['mycollection']);
```

After we connected to can query or update the database just how we would using the mongo API with the exception that we use a callback

``` js
// find everything
db.mycollection.find(callback);

// find everything, but sort by name
db.mycollection.find().sort({name:1}, callback);

// iterate over all whose level is greater than 90 (callback(null,null) indicates that the iteration has finished)
db.mycollection.find({level:{$gt:90}}).forEach(callback);

// find all named 'mathias' and increment their level
db.mycollection.update({name:'mathias'}, {$inc:{level:1}}, {multi:true}, callback);

// use the save function to just save a document (the callback is optional for all writes)
db.mycollection.save({created:'just now'});
```

For more detailed information about the different usages of update and quering see [the mongo docs](http://www.mongodb.org/display/DOCS/Manual)