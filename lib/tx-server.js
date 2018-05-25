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

  app.get('/info', (req, res) => {
    res.json(nodeInfo)
  })
  app.use('/tendermint', proxy(tendermintRpcUrl))

  app.get('/state', (req, res) => {
    res.json(store)
  })

  return app
}
