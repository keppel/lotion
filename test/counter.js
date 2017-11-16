let axios = require('axios')
let test = require('tape-promise/tape')
let lotion = require('../index.js')
let rimraf = require('rimraf')
let { promisify } = require('util')

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getState() {
  return axios.get('http://localhost:3000/state').then(res => res.data)
}

test('setup', async t => {
  // configure lotion app to test against
  let opts = {
    initialState: { txCount: 0, blockCount: 0, specialTxCount: 0 },
    devMode: true
  }

  let app = lotion(opts)
  function txHandler(state, tx, chainInfo) {
    state.txCount++
    if (tx.shouldError === true) {
      throw new Error('this transaction should cause an error')
    }
    if (tx.isSpecial) {
      state.specialTxCount++
    }
    if (tx.mutateDeep) {
      if (!state.accounts) {
        state.accounts = {}
        state.accounts.foo = {}
        state.accounts.foo.balance = 40
      } else {
        state.accounts.foo.otherBalance = 60
      }
    }
  }

  function blockHandler(state, chainInfo) {
    state.blockCount++
    state.lastHeight = chainInfo.height
  }

  function txEndpoint(tx, nodeInfo) {
    return Object.assign({}, tx, { isSpecial: true })
  }

  app.use(txHandler)
  app.useBlock(blockHandler)
  app.useTxEndpoint('/special', txEndpoint)

  await app.listen(3000)

  t.end()
})

test('get initial state', async t => {
  let state = await getState()

  t.equal(state.txCount, 0)
  t.end()
})

test('send a tx', async t => {
  let result = await axios
    .post('http://localhost:3000/txs', {})
    .then(res => res.data.result)

  t.equal(result.check_tx.code, 0, 'no check_tx error code')
  t.equal(result.deliver_tx.code, 0, 'no deliver_tx error code')

  // fetch state again
  let state = await getState()
  t.equal(state.txCount, 1, 'txCount should have incremented')
  t.end()
})

test('block handler should attach block height to state', async t => {
  await delay(3000)
  let state = await getState()
  t.ok(state.blockCount > 2)
  t.equal(state.blockCount, state.lastHeight)
  t.end()
})

test('tendermint node proxy', async t => {
  let result = await axios.get('http://localhost:3000/tendermint/status')
  t.equal(typeof result.data.result.node_info, 'object')
  t.end()
})

test('error handling', async t => {
  let result = await axios.post('http://localhost:3000/txs', {
    shouldError: true
  })
  t.equal(result.data.result.check_tx.code, 2)
  t.equal(
    result.data.result.check_tx.log,
    'Error: this transaction should cause an error'
  )
  t.end()
})

test('custom endpoint', async t => {
  let result = await axios.post('http://localhost:3000/txs/special', {})
  t.equal(result.data.state.specialTxCount, 1)
  t.end()
})

test('deeply nested state mutations', async t => {
  let result = await axios.post('http://localhost:3000/txs', {
    mutateDeep: true
  })
  t.equal(result.data.state.accounts.foo.balance, 40)
  t.equal(result.data.state.accounts.foo.otherBalance, undefined)
  result = await axios.post('http://localhost:3000/txs', {
    mutateDeep: true
  })
  t.equal(result.data.state.accounts.foo.otherBalance, 60)
  t.end()
})

test('node info endpoint', async t => {
  let result = await axios.get('http://localhost:3000/info')
  t.equal(result.data.pubKey.length, 64)
  t.end()
})

test('cleanup', t => {
  app.close()
  t.end()
})