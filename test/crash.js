const mongojs = require('../index')
const db = mongojs('localhost', ['test'])

db.test.findOne(() => {
  throw new Error('I should crash the program')
})

setTimeout(() => {
  throw new Error('timeout')
}, 5000)
