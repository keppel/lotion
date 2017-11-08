let express = require('express')
let { json } = require('body-parser')
let axios = require('axios')
let encodeTx = require('./tx-encoding.js').encode
let proxy = require('express-http-proxy')

module.exports = function({
  port,
  tendermintPort,
  appState,
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

  app.use('/tendermint', proxy('http://localhost:' + tendermintPort))

  return app
}
