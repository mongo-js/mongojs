# mongojs

A [node.js](http://nodejs.org) module for mongodb, that emulates [the official mongodb API](http://www.mongodb.org/display/DOCS/Home) as much as possible.
It wraps [mongodb-native](https://github.com/christkv/node-mongodb-native) and is available through [npm](http://npmjs.org)

	npm install mongojs

[![Build Status](https://travis-ci.org/mafintosh/mongojs.svg?branch=master)](https://travis-ci.org/mafintosh/mongojs)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

## Usage

mongojs is easy to use:

```js
var mongojs = require('mongojs')
var db = mongojs(connectionString, [collections])
```

The connection string should follow the format described in [the mongo connection string docs](http://docs.mongodb.org/manual/reference/connection-string/).
Some examples of this could be:

```js
// simple usage for a local db
var db = mongojs('mydb', ['mycollection'])

// the db is on a remote server (the port default to mongo)
var db = mongojs('example.com/mydb', ['mycollection'])

// we can also provide some credentials
var db = mongojs('username:password@example.com/mydb', ['mycollection'])

// connect using SCRAM-SHA-1 mechanism
var db = mongojs('username:password@example.com/mydb?authMechanism=SCRAM-SHA-1', ['mycollection'])

// connect using a different auth source
var db = mongojs('username:password@example.com/mydb?authSource=authdb', ['mycollection'])

// connect now, and worry about collections later
var db = mongojs('mydb')
var mycollection = db.collection('mycollection')
```

[More connection string examples](http://mongodb.github.io/node-mongodb-native/2.0/reference/connecting/)

After we connected we can query or update the database just how we would using the mongo API with the exception that we use a callback.
The format for callbacks is always `callback(error, value)` where error is null if no exception has occured. The update methods `save`, `remove`, `update` and `findAndModify` also pass the `lastErrorObject` as the last argument to the callback function.

```js
// find everything
db.mycollection.find(function (err, docs) {
	// docs is an array of all the documents in mycollection
})

// find everything, but sort by name
db.mycollection.find().sort({name: 1}, function (err, docs) {
	// docs is now a sorted array
})

// iterate over all whose level is greater than 90.
db.mycollection.find({level: {$gt: 90}}).forEach(function (err, doc) {
	if (!doc) {
		// we visited all docs in the collection
		return
	}
	// doc is a document in the collection
})

// find a document using a native ObjectId
db.mycollection.findOne({
	_id: mongojs.ObjectId('523209c4561c640000000001')
}, function(err, doc) {
	// doc._id.toString() === '523209c4561c640000000001'
})

// find all named 'mathias' and increment their level
db.mycollection.update({name: 'mathias'}, {$inc: {level: 1}}, {multi: true}, function () {
	// the update is complete
})

// find one named 'mathias', tag him as a contributor and return the modified doc
db.mycollection.findAndModify({
	query: { name: 'mathias' },
	update: { $set: { tag: 'maintainer' } },
	new: true
}, function (err, doc, lastErrorObject) {
	// doc.tag === 'maintainer'
})


// use the save function to just save a document (callback is optional for all writes)
db.mycollection.save({created: 'just now'})
```

If you provide a callback to `find` or any cursor config operation mongojs will call `toArray` for you

```js
db.mycollection.find({}, function (err, docs) { ... })

db.mycollection.find({}).limit(2).skip(1, function (err, docs) { ... })
```
is the same as

```js
db.mycollection.find({}).toArray(function (err, docs) { ... })

db.mycollection.find({}).limit(2).skip(1).toArray(function (err, docs) { ... })
```

For more detailed information about the different usages of update and querying see [the mongo docs](http://www.mongodb.org/display/DOCS/Manual)


## Events

```js
var db = mongojs('mydb', ['mycollection'])

db.on('error', function (err) {
	console.log('database error', err)
})

db.on('connect', function () {
	console.log('database connected')
})
```


## Streaming cursors

As of `0.7.0` all cursors are a [readable stream](http://nodejs.org/api/stream.html#stream_readable_stream) of objects.

```js
var JSONStream = require('JSONStream')

// pipe all documents in mycollection to stdout
db.mycollection.find({}).pipe(JSONStream.stringify()).pipe(process.stdout)
```

Notice that you should pipe the cursor through a stringifier (like [JSONStream](https://github.com/dominictarr/JSONStream))
if you want to pipe it to a serial stream like a http response.

## Tailable cursors

If you are using a capped collection you can create a [tailable cursor](http://docs.mongodb.org/manual/tutorial/create-tailable-cursor/) to that collection by adding `tailable:true` to the find options

```js
var cursor = db.mycollection.find({}, {}, {tailable: true, timeout: false})

// since all cursors are streams we can just listen for data
cursor.on('data', function (doc) {
	console.log('new document', doc)
})
```

Note that you need to explicitly set the selection parameter in the `find` call.

## Database commands

With mongojs you can run database commands just like with the mongo shell using `db.runCommand()`

```js
db.runCommand({ping: 1}, function (err, res) {
	if(!err && res.ok) console.log('we\'re up')
})
```

or `db.collection.runCommand()`

```js
db.things.runCommand('count', function (err, res) {
	console.log(res)
})
```

## Bulk updates

As of 0.15 mongojs supports the Bulk updates introduced in mongodb 2.6. Here's an example of the usage

```js
var bulk = db.a.initializeOrderedBulkOp()
bulk.find({type: 'water'}).update({$set: {level: 1}})
bulk.find({type: 'water'}).update({$inc: {level: 2}})
bulk.insert({name: 'Spearow', type: 'flying'})
bulk.insert({name: 'Pidgeotto', type: 'flying'})
bulk.insert({name: 'Charmeleon', type: 'fire'})
bulk.find({type: 'flying'}).removeOne()
bulk.find({type: 'fire'}).remove()
bulk.find({type: 'water'}).updateOne({$set: {hp: 100}})

bulk.execute(function (err, res) {
  console.log('Done!')
})
```

## Replication Sets

Mongojs can also connect to a mongo replication set by providing a connection string with multiple hosts

```js
var db = mongojs('rs-1.com,rs-2.com,rs-3.com/mydb?slaveOk=true', ['mycollection'])
```

For more detailed information about replica sets see [the mongo replication docs](http://www.mongodb.org/display/DOCS/Replica+Sets)

## Using harmony features

If you run node.js with the `--harmony` option, then you can ommit the collection names array, and you can do stuff like.

```js
var mongojs = require('mongojs')
var db = require('mydb')

db.hackers.insert({name: 'Ed'})
```

In the above example the `hackers` collection is enabled automagically (similar to the shell) using the `Proxy` feature in harmony

## Passing a DB to the constructor

If you have an instance of mongojs, you can pass this to the constructor and mongojs will use the
existing connection of that instance instead of creating a new one.

```js
var mongodb = require('mongodb')
var mongojs = require('mongojs')

mongodb.Db.connect('mongodb://localhost/test', function (err, theDb) {
    var db = mongojs(theDb, ['myCollection'])
})
```

## Features not supported for MongoDB 2.4 or older (on mongojs version 1.0+).

* Index creation and deletion
* Aggregation cursors.

This features are relatively easy to add, but would make the code unnecessarily more complex.
If you are using mongodb 2.4 or older and would like to use mongojs 1.0 with the above mentioned
feautres, feel free to make a pull request or open and issue..

## Upgrading from 0.x.x to 1.2.x

Version > 1.0.x is a major rewrite of mongojs. So expect some things not to work the same as in mongojs 0.x.x versions. Breaking changes include:

* __Removed__ `mongojs.connect` use `mongojs()` directly instead

# API

This API documentation is a work in progress.

#### Collection

#####`db.collection.aggregate([pipeline], [options], [callback])`
https://docs.mongodb.org/manual/reference/method/db.collection.aggregate/

#####`db.collection.aggregate([pipelineStep], [pipelineStep], [pipelineStep], ..., [callback])`

#####`db.collection.count([query], callback)`

#####`db.collection.createIndex(keys, options, [callback])`

#####`db.collection.distinct(field, query, callback)`

#####`db.collection.drop([callback])`

#####`db.collection.dropIndex(index, [callback])`

#####`db.collection.dropIndexes([callback])`

#####`db.collection.ensureIndex(keys, options, [callback])`

#####`db.collection.find([criteria], [projection], [callback])`

This function applies a query to a collection. You can get the return value, which is a cursor, or pass a callback
as the last parameter. Said callback receives `(err, documents)`

#####`db.collection.findOne([criteria], [projection], callback)`

Apply a query and get one single document passed as a callback. The callback receives `(err, document)`

#####`db.collection.findAndModify(document, callback)`

#####`db.collection.getIndexes(callback)`

#####`db.collection.group(document, callback)`

#####`db.collection.insert(docOrDocs, [callback])`

#####`db.collection.isCapped(callback)`

#####`db.collection.mapReduce(map, reduce, options, [callback])`

#####`db.collection.reIndex([callback])`

#####`db.collection.remove(query, [justOne], [callback])`
#####`db.collection.remove(query, [options], [callback])`

#####`db.collection.runCommand(command, [callback])`

#####`db.collection.save(doc, [options], [callback])`

#####`db.collection.stats(callback)`

#####`db.collection.update(query, update, [options], [callback])`

#####`db.collection.toString()`

Get the name of the collection.

#### Cursor

#####`cursor.batchSize(size, [callback])`

#####`cursor.count(callback)`

#####`cursor.explain(callback)`

#####`cursor.forEach(function)`

#####`cursor.limit(n, [callback])`

#####`cursor.map(function, [callback])`

#####`cursor.next(callback)`

#####`cursor.skip(n, [callback])`

#####`cursor.sort(sortOptions, [callback])`

#####`cursor.toArray(callback)`

#####`cursor.rewind()`

#####`cursor.destroy()`

#### Database

#####`db.addUser(document)`

#####`db.createCollection(name, options, [callback])`

#####`db.dropDatabase([callback])`

#####`db.eval(code, [params], [options], [callback])`

#####`db.getCollectionNames(callback)`

#####`db.getLastError(callback)`

#####`db.getLastErrorObj(callback)`

#####`db.removeUser(username, [callback])`

#####`db.runCommand(command, [callback])`

#####`db.stats([callback])`

#####`db.close()`

#### Bulk

#####`bulk.execute()`

#####`bulk.find(query)`

#####`bulk.find.remove()`

#####`bulk.find.removeOne()`

#####`bulk.find.replaceOne(document)`

#####`bulk.find.update(updaterParam)`

#####`bulk.find.updateOne(updaterParam)`

#####`bulk.find.upsert(upsertParam)`

#####`bulk.insert(document)`

#####`bulk.toString()`

#####`bulk.tojson()`
