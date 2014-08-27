var test = require('tape');

if (typeof setImmediate === 'undefined') setImmediate = process.nextTick;
setImmediate(function() {
  test('end', function(t) {
    t.end();
    process.exit();
  });
});

module.exports = test;
