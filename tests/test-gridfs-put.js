var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', [], ['fs']);

db.fs.put(new Buffer('Hello world'), {}, function (err, result) {
    assert.equal(null, err);
    assert.ok(result != null);
    assert.ok(result._id != null);

    // Get data
    db.fs.get(result._id, function (err, data) {
        assert.equal(null, err);
        assert.ok(data != null);

        // Delete file
        db.fs.delete(result._id, function (err, result2) {
            assert.equal(null, err);
            assert.equal(true, result2);

            // Fetch the content, showing that the file is gone
            db.fs.get(result._id, function (err, data) {
                assert.ok(err != null);
                assert.equal(null, data);

                db.close();
            });
        });
    });
});
