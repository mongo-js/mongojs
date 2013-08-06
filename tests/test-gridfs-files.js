var assert = require('assert');
var mongojs = require('../index');
var db = mongojs('test', ['fs.files'], ['fs']);

db.fs.put(new Buffer('Hello world'), {metadata: {'type': 'customer'}}, function (err, result) {
    assert.equal(null, err);
    assert.ok(result != null);
    assert.ok(result._id != null);

    // Get count
    db.fs.files.count({'metadata.type': 'customer'}, function (err, data) {
        assert.equal(null, err);
        assert.ok(data === 1);

        // Delete file
        db.fs.delete(result._id, function (err, result2) {
            assert.equal(null, err);
            assert.equal(true, result2);

            db.close();
        });
    });
});
