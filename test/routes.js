let test = require('ava')
let lotion = require('../')

test('counter app with routes', async function(t) {
  let app = lotion({
    initialState: { counter: { count: 0 } },
    rpcPort: 26657
  })

  app.use('counter', function(state, type) {
    state.count++
  })

  let { rpcPort, genesisPath } = await app.start()

  let { state, send } = await lotion.connect(
    null,
    { genesis: require(genesisPath), nodes: [`ws://localhost:${rpcPort}`] }
  )
  let result = await send({ type: 'counter' })
  await delay()
  let count = await state.counter.count
  t.is(count, 1)
})

function delay(ms = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
