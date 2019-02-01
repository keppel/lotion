let test = require('ava')
let lotion = require('../')

test('counter app with routes', async function(t) {
  let app = lotion({
    initialState: { counter: { count: 0 } },
    p2pPort: 20000,
    rpcPort: 20001,
    abciPort: 20002
  })

  app.use('counter', function(state, type) {
    state.count++
  })

  let { ports, genesisPath } = await app.start()

  let { state, send } = await lotion.connect(
    null,
    { genesis: require(genesisPath), nodes: [`ws://localhost:${ports.rpc}`] }
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
