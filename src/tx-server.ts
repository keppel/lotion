let express = require('express')
let { json } = require('body-parser')
let axios = require('axios')
let proxy = require('express-http-proxy')
let cors = require('cors')

let vstruct = require('varstruct')
let { stringify, parse } = require('deterministic-json')

let TxStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) },
  { name: 'nonce', type: vstruct.UInt32BE }
])

function decode(txBuffer) {
  let decoded = TxStruct.decode(txBuffer)
  let tx = parse(decoded.data)
  return tx
}

function encode(txData, nonce) {
  let data = stringify(txData)
  let bytes = TxStruct.encode({ nonce, data })
  return bytes
}

export = function({
  port,
  rpcPort,
  stateMachine
}) {
  let app = express()
  app.use(cors())
  app.use(json({ type: '*/*' }))
  app.post('/txs', async (req, res) => {
    // encode transaction bytes, send it to tendermint node
    let nonce = Math.floor(Math.random() * (2 << 12))
    let txBytes = '0x' + encode(req.body, nonce).toString('hex')
    let result = await axios.get(`http://localhost:${rpcPort}/broadcast_tx_commit`, {
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
    res.json(stateMachine.info())
  })
  app.use('/tendermint', proxy(`http://localhost:${rpcPort}`))

  app.get('/state', (req, res) => {
    res.json(stateMachine.query())
  })

  return app
}
