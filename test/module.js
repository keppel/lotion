let test = require('ava')
let lotion = require('../')

const RPC_PORT = 26659

test('counter app with module api', async function(t) {
  let app = lotion({
    rpcPort: RPC_PORT,
    initialState: { count: 'foo' }
  })

  let moduleA = {
    // `initialize` be function or array of functions
    initializers: [
      function(state, context) {
        state.transactionCount = 0
        state.blockCount = 0
      }
    ],

    // `transactionHandlers` can be function or array of functions
    transactionHandlers: [
      function(state, tx) {
        state.transactionCount++
      }
    ],

    // `blockHandlers` can be function or array of functions
    blockHandlers: [
      function(state, context) {
        state.blockCount++
      }
    ],

    // modules can expose methods to other modules
    methods: {
      increment(state, n = 1) {
        state.transactionCount += n
      }
    }
  }

  let moduleB = {
    transactionHandlers: [
      function(state, tx, context) {
        context.modules.a.increment(tx.n)
      }
    ]
  }

  app.use('a', moduleA)
  app.use('b', moduleB)

  let { genesisPath } = await app.start()

  let { state, send } = await lotion.connect(
    null,
    { genesis: require(genesisPath), nodes: [`ws://localhost:${RPC_PORT}`] }
  )

  let txCount = await state.a.transactionCount
  t.is(txCount, 0)

  let result = await send({ type: 'a' })
  await delay()
  txCount = await state.a.transactionCount
  t.is(txCount, 1)

  result = await send({ type: 'b', n: 2 })
  await delay()
  txCount = await state.a.transactionCount
  t.is(txCount, 3)

  let blockCount = await state.a.blockCount
  t.true(blockCount > 0)
})

function delay(ms = 4000) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
