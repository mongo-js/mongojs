# mongojs
A wrapper around the mongodb driver [mongodb-native](https://github.com/christkv/node-mongodb-native/) for [node.js](http://nodejs.org) that tries to emulate the mongo shell as much as possible.  
It is available through npm:

	npm install db

DB is very simple to use:

``` js
	var db = require('db').connect(databaseURL, [collections]);
```

Some examples of this could be:

``` js
	// simple usage for a local db
	var db = require('db').connect('mydb', ['mycollection']);
	
	// the db is on a remote server (the port default to mongo)
	var db = require('db').connect('example.com/mydb', ['mycollection']);
	
	// we can also provide some credentials
	var db = require('db').connect('username:password@example.com/mydb', ['mycollection']);
```

After we connected to can query or update the database just how we would using the mongo shell with the exception that we use a callback

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