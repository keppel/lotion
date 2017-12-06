let lotion = require('../index.js')
let { connect } = lotion
let test = require('tape-promise/tape')
let startCounterApp = require('./lib/start-counter-app.js')

test('setup', async t => {
  // GCI = await startCounterApp()
  GCI = 'QmVzjHtfQobbxbVydJX9XZz2zJMRddTWTvZpPdScbDZ9HP'
})

test('light client state query', async t => {
  let { state, send } = connect(GCI)

  await state
  console.log(state)
})
