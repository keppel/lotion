let express = require('express')
let { json } = require('body-parser')
let axios = require('axios')
let encodeTx = require('./tx-encoding.js').encode
let proxy = require('express-http-proxy')
let cors = require('cors')

module.exports = function({
  port,
  tendermintPort,
  tendermintRpcUrl,
  txEndpoints,
  store,
  nodeInfo
}) {
  let app = express()
  app.use(cors())
  app.use(json({ type: '*/*' }))
  app.post('/txs', async (req, res) => {
    // encode transaction bytes, send it to tendermint node
    let nonce = Math.floor(Math.random() * (2 << 12))
    let txBytes = '0x' + encodeTx(req.body, nonce).toString('hex')
    let result = await axios.get(`${tendermintRpcUrl}/broadcast_tx_commit`, {
      params: {
        tx: txBytes
      }
    })
    let response = {
      result: result.data.result
    }
    res.json(response)
  })

  let txEndpointStacks = {}
  txEndpoints.forEach(endpoint => {
    if (!txEndpointStacks[endpoint.path]) {
      txEndpointStacks[endpoint.path] = []
    }
    txEndpointStacks[endpoint.path].push(endpoint.middleware)
  })

  // compile middleware stacks into a single function
  for (let key in txEndpointStacks) {
    app.post('/txs' + key, async (req, res) => {
      // run custom tx encoding stack for this endpoint
      let customEncodedTx = compileStack(txEndpointStacks[key])(
        req.body,
        nodeInfo
      )
      // submit encoded tx to normal /txs endpoint
      let result = await axios.post(
        `http://localhost:${port}/txs`,
        customEncodedTx
      )

      res.json(result.data)
    })
  }

  app.get('/info', (req, res) => {
    res.json(nodeInfo)
  })
  app.use('/tendermint', proxy(tendermintRpcUrl))

  app.get('/state', (req, res) => {
    res.json(store)
  })

  return app
}

function compileStack(stack) {
  return (tx, nodeInfo) => {
    let lastEncodedTx = tx
    stack.forEach(middleware => {
      lastEncodedTx = middleware(lastEncodedTx, nodeInfo)
    })

    return lastEncodedTx
  }
}
