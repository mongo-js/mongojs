# mongojs
A [node.js](http://nodejs.org) module for mongodb, that emulates [the official mongodb API](http://www.mongodb.org/display/DOCS/Home) as much as possible. It wraps [mongodb-native](https://github.com/christkv/node-mongodb-native/).
It is available through npm:

	npm install mongojs

## Usage

mongojs is easy to use:

``` js
var mongojs = require('mongojs');
var db = mongojs(connectionString, [collections]);
```

The connection string should follow the format desribed in [the mongo connection string docs](http://docs.mongodb.org/manual/reference/connection-string/).
Some examples of this could be:

``` js
// simple usage for a local db
var db = mongojs('mydb', ['mycollection']);

// the db is on a remote server (the port default to mongo)
var db = mongojs('example.com/mydb', ['mycollection']);

// we can also provide some credentials
var db = mongojs('username:password@example.com/mydb', ['mycollection']);

// connect now, and worry about collections later
var db = mongojs('mydb');
var mycollection = db.collection('mycollection');
```

After we connected we can query or update the database just how we would using the mongo API with the exception that we use a callback
The format for callbacks is always `callback(error, value)` where error is null if no exception has occured.

``` js
// find everything
db.mycollection.find(function(err, docs) {
	// docs is an array of all the documents in mycollection
});

// find everything, but sort by name
db.mycollection.find().sort({name:1}, function(err, docs) {
	// docs is now a sorted array
});

// iterate over all whose level is greater than 90.
db.mycollection.find({level:{$gt:90}}).forEach(function(err, doc) {
	if (!doc) {
		// we visited all docs in the collection
		return;
	}
	// doc is a document in the collection
});

// find all named 'mathias' and increment their level
db.mycollection.update({name:'mathias'}, {$inc:{level:1}}, {multi:true}, function(err) {
	// the update is complete
});

// find one named 'mathias', tag him as a contributor and return the modified doc

db.mycollection.findAndModify({
	query: { name: 'mathias' },
	update: { $set: { tag:'maintainer' } },
	new: true
}, function(err, doc) {
	// doc.tag === 'maintainer'
});


// use the save function to just save a document (the callback is optional for all writes)
db.mycollection.save({created:'just now'});
```

If you provide a callback to `find` or any cursor config operation mongojs will call `toArray` for you

``` js
db.mycollection.find({}, function(err, docs) { ... });

db.mycollection.find({}).limit(2).skip(1, function(err, docs) { ... });
```
is the same as

``` js
db.mycollection.find({}).toArray(function(err, docs) { ... });

db.mycollection.find({}).limit(2).skip(1).toArray(function(err, docs) { ... });
```


For more detailed information about the different usages of update and quering see [the mongo docs](http://www.mongodb.org/display/DOCS/Manual)

## Streaming cursors

As of `0.7.0` all cursors are a [readable stream](http://nodejs.org/api/stream.html#stream_readable_stream) of objects.

``` js
var JSONStream = require('JSONStream');

// pipe all documents in mycollection to stdout
db.mycollection.find({}).pipe(JSONStream.stringify()).pipe(process.stdout);
```

Notice that you should pipe the cursor through a stringifier (like [JSONStream](https://github.com/dominictarr/JSONStream))
if you want to pipe it to a serial stream like a http response.

## Tailable cursors

If you are using a capped collection you can create a [tailable cursor](http://docs.mongodb.org/manual/tutorial/create-tailable-cursor/) to that collection by adding `tailable:true` to the find options

``` js
var cursor = db.mycollection.find({}, {}, {tailable:true, timeout:false});

// since all cursors are streams we can just listen for data
cursor.on('data', function(doc) {
	console.log('new document', doc);
});
```

Note that you need to explicitly set the selection parameter in the `find` call.

## Replication Sets

Mongojs can also connect to a mongo replication set by providing a connection string with multiple hosts

``` js
var db = mongojs('rs-1.com,rs-2.com,rs-3.com/mydb?slaveOk=true', ['mycollection']);
```

For more detailed information about replica sets see [the mongo replication docs](http://www.mongodb.org/display/DOCS/Replica+Sets)

## License

MIT
