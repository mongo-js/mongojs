var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', [], ['b']);

var grid = db.b;

grid.getGridFs(function (error, gridFs) {
    gridFs.put(new Buffer('Hello world'), {}, function(err, result) {

        // Delete file
        gridFs.delete(result._id, function(err, result2) {
            assert.equal(null, err);
            assert.equal(true, result2);

            // Fetch the content, showing that the file is gone
            gridFs.get(result._id, function(err, data) {
                assert.ok(err != null);
                assert.equal(null, data);

                db.close();
            });
        });
    });
});