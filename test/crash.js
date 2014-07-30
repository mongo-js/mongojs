var mongojs = require('../index');
var db = mongojs('localhost', ['test']);

db.test.findOne(function() {
  throw new Error('I should crash the program');
});

setTimeout(function() {
  throw new Error('timeout');
}, 5000);
