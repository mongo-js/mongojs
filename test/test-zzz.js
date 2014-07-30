var test = require('tape');

test('end', function(t) {
  t.end();
  process.exit();
});
