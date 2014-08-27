var test = require('tape');

setImmediate(function() {
  test('end', function(t) {
    t.end();
    process.exit();
  });
});

module.exports = test;
