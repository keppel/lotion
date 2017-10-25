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

async function main() {
  // configure lotion app to test against
  let opts = {
    initialState: { txCount: 0, blockCount: 0 }
  }

  let app = lotion(opts)
  function txHandler(state, tx, chainInfo) {
    state.txCount++
  }

  function blockHandler(state, chainInfo) {
    state.blockCount++
    state.lastHeight = chainInfo.height
  }
  app.use(txHandler)
  app.useBlock(blockHandler)
  await app.listen(3000)
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
  })

  // clean up
  test('clean up', t => {
    t.end()
    rimraf('./lotion-data', process.exit)
  })
}

main()
