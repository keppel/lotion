let express = require('express')
let { json } = require('body-parser')
let axios = require('axios')
let encodeTx = require('./tx-encoding.js').encode
let proxy = require('express-http-proxy')

module.exports = function({
  port,
  tendermintPort,
  txEndpoints,
  appState,
  nodeInfo,
  txCache,
  txStats
}) {
  let app = express()
  app.use(json({ type: '*/*' }))
  app.post('/txs', async (req, res) => {
    // encode transaction bytes, send it to tendermint node
    let txBytes =
      '0x' + encodeTx(req.body, txStats.txCountNetwork).toString('hex')
    let result = await axios.get(
      `http://localhost:${tendermintPort}/broadcast_tx_commit`,
      {
        params: {
          tx: txBytes
        }
      }
    )
    let response = {
      result: result.data.result,
      state: appState
    }

    res.json(response)
  })

  app.get('/state', (req, res) => {
    res.json(appState)
  })

  app.get('/txs', (req, res) => {
    // todo: streaming response instead of buffering
    let rs = txCache.createReadStream({
      keys: false,
      values: true,
      valueEncoding: 'json'
    })

    let result = []
    rs.on('data', data => {
      result.push(data)
    })
    rs.on('end', () => {
      res.json(result)
    })
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

  app.use('/tendermint', proxy('http://localhost:' + tendermintPort))

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
