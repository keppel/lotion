let { promisify } = require('util')
let abci = require('./lib/abci/')
let express = require('express')
let { json } = require('body-parser')
let axios = require('axios')
let { spawn } = require('child_process')
let getPort = require('get-port')
let tmBin = __dirname + '/bin/tendermint'
let createHash = require('sha.js')
let vstruct = require('varstruct')
let level = require('level')
let memdown = require('memdown')
let fs = require('fs')
let readFile = promisify(fs.readFile)
let writeFile = promisify(fs.writeFile)
let Dat = promisify(require('dat-node'))
let swarm = require('discovery-swarm')
let rimraf = promisify(require('rimraf'))

let TxStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) },
  { name: 'nonce', type: vstruct.UInt32BE }
])

function encodeTx(txData, nonce) {
  let data = JSON.stringify(txData)
  let bytes = TxStruct.encode({ nonce, data })
  return bytes
}

function decodeTx(txBuffer) {
  let decoded = TxStruct.decode(txBuffer)
  let tx = JSON.parse(decoded.data)
  return tx
}

class AbciApp {
  constructor() {}
  initChain(req, cb) {
    cb()
  }
  info(req, cb) {
    cb()
  }
  beginBlock(req, cb) {
    cb()
  }
  endBlock(req, cb) {
    cb()
  }
  commit(req, cb) {
    cb()
  }
  checkTx(req, cb) {
    throw new Error('You must override the default checkTx')
  }
  deliverTx(req, cb) {
    throw new Error('You must override the default deliverTx')
  }
}

async function getPorts() {
  let p2pPort = await getPort(46656)
  let tendermintPort = await getPort()
  let abciPort = await getPort(46658)

  return { tendermintPort, abciPort, p2pPort }
}

function initNode(tendermintPath) {
  return new Promise((resolve, reject) => {
    let tmInitProcess = spawn(tmBin, ['init', '--home', tendermintPath])
    tmInitProcess.on('close', resolve)
  })
}

function runTx(handler, appState, tx, allowMutation = false) {
  let stateMutated = false
  let invalidMutation = false
  let hookedState = new Proxy(appState, {
    get: (target, name) => {
      if (stateMutated) {
        invalidMutation = true
      }
      return target[name]
    },
    set: (target, name, value) => {
      if (allowMutation) {
        target[name] = value
      }
      stateMutated = true
    }
  })
  handler(hookedState, tx)
  return stateMutated && !invalidMutation
}

function defaultChainId(initialState, handler) {
  let sha256 = createHash('sha256')
  let chainId = sha256
    .update(JSON.stringify(initialState) + handler.toString(), 'utf8')
    .digest('hex')
  return chainId
}

function getInitialPeers(peerSwarm) {
  return new Promise((resolve, reject) => {
    let peerTimeout = 4000
    let peers = []
    let gotFirstPeer = false
    peerSwarm.on('connection', (conn, info) => {
      if (info.host.indexOf(':') === -1) {
        conn.on('data', data => {
          let p = data.toString('utf8')
          if (
            p.split(':').length === 2 &&
            p.indexOf('peer:') === 0 &&
            p.indexOf(',') === -1
          ) {
            let port = Number(p.split(':')[1])
            if (isNaN(port) || port < 1000 || port > 65535) {
              return
            }
            let peerString = [info.host, port].join(':')
            peers.push(peerString)
            if (!gotFirstPeer) {
              gotFirstPeer = true
              console.log(peerString)
              setTimeout(() => {
                resolve(peers)
              }, 1000)
            }
          }
        })
      }
    })

    setTimeout(() => {
      if (!gotFirstPeer) {
        resolve(peers)
      }
    }, peerTimeout)
  })
}

function reportSelfAsPeer(peerSwarm, p2pPort) {
  peerSwarm.on('connection', (conn, info) => {
    conn.write('peer:' + p2pPort, 'utf8')
  })
}

function downloadDat(dat) {
  return new Promise((resolve, reject) => {
    let stats = dat.trackStats()
    function updateHandler() {
      let status = stats.get()
      if (status.length && status.downloaded >= status.length) {
        stats.removeListener('update', updateHandler)
        resolve()
      }
    }
    stats.on('update', updateHandler)
    dat.joinNetwork()
  })
}

module.exports = function Lotion(opts = {}) {
  let initialState = opts.initialState || {} // optional, can download from dat
  let tendermintPath = opts.path || './lotion-data'
  let store = opts.store
  let port = opts.port || 3001
  let peers = opts.peers || []

  return async function createServer(handler) {
    let txCache = level({ db: memdown, valueEncoding: 'json' })
    // async setup stuff
    let { tendermintPort, abciPort, p2pPort } = await getPorts()
    let genesisKey = opts.genesisKey
    await initNode(tendermintPath)

    let sharedDir = tendermintPath + '/shared'
    if (typeof genesisKey === 'string') {
      // fetch initial state and validators from dat
      let dat = await Dat(sharedDir, { key: genesisKey })
      await downloadDat(dat)
      let genesisJson = await readFile(sharedDir + '/tm-genesis.json')
      await writeFile(tendermintPath + '/genesis.json', genesisJson)
      let initialStateJson = await readFile(
        sharedDir + '/initial-state.json',
        'utf8'
      )
      // if initial state provided, make sure it matches the one from the genesis key
      if (opts.initialState) {
        if (initialStateJson !== JSON.stringify(initialState)) {
          throw new Error('genesis key does not match provided initial state')
        }
      }
    } else {
      // this is an initial validator node, serve genesis dat archive
      let dat = await Dat(sharedDir)
      let genesisJson = await readFile(tendermintPath + '/genesis.json')

      await writeFile(
        sharedDir + '/initial-state.json',
        JSON.stringify(initialState)
      )
      await writeFile(sharedDir + '/tm-genesis.json', genesisJson)
      dat.importFiles()
      dat.joinNetwork()
      genesisKey = dat.key.toString('hex')
    }

    // hook app state modifications
    let txCountNetwork = 0
    let nodeNonce = 0
    let appState = Object.assign({}, initialState)
    // start tx server
    let app = express()
    app.use(json())
    app.post('/txs', async (req, res) => {
      // encode transaction bytes, send it to tendermint node
      let txBytes = '0x' + encodeTx(req.body, txCountNetwork).toString('hex')
      let result = await axios.get(
        `http://localhost:${tendermintPort}/broadcast_tx_commit`,
        {
          params: {
            tx: txBytes
          }
        }
      )
      let response = {
        result: result.data.result
      }
      if (req.query.return_state) {
        response.state = appState
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

    let peerSwarmPort = await getPort()
    let peerSwarm = swarm()
    peerSwarm.listen(peerSwarmPort)
    peerSwarm.join(genesisKey)
    peers = peers.concat(await getInitialPeers(peerSwarm))
    reportSelfAsPeer(peerSwarm, p2pPort)
    let tpArgs = [
      'node',
      '--rpc.laddr',
      'tcp://127.0.0.1:' + tendermintPort,
      '--proxy_app',
      'tcp://127.0.0.1:' + abciPort,
      '--home',
      tendermintPath,
      '--p2p.laddr',
      'tcp://0.0.0.0:' + p2pPort
    ]
    if (peers.length) {
      tpArgs.push('--p2p.seeds')
      tpArgs.push(peers.join(','))
    }

    let tendermintProcess = spawn(tmBin, tpArgs)
    if (opts.logTendermint) {
      tendermintProcess.stdout.pipe(process.stdout)
      tendermintProcess.stderr.pipe(process.stderr)
    }
    tendermintProcess.on('close', () => {
      throw new Error('Tendermint node crashed')
    })

    // start tendermint-facing abci server
    let abciApp = new AbciApp()

    abciApp.checkTx = function(req, cb) {
      let rawTx = req.check_tx.tx.toBuffer()
      let tx = decodeTx(rawTx)
      let isValid = runTx(handler, appState, tx, false)
      let code = isValid ? abci.CodeType.OK : abci.CodeType.EncodingError
      cb({ code })
    }

    abciApp.deliverTx = function(req, cb) {
      let rawTx = req.deliver_tx.tx.toBuffer()
      let tx = decodeTx(rawTx)

      let isValid = runTx(handler, appState, tx, true)
      if (isValid) {
        cb({ code: abci.CodeType.OK })
        txCache.put(txCountNetwork, tx, (err, doc) => {})
        txCountNetwork++
      } else {
        cb({ code: abci.CodeType.EncodingError })
      }
    }

    abciApp.commit = function(req, cb) {
      let sha256 = createHash('sha256')
      // unless a merkle store is used, this will get slow when the state is big:
      let appHash = sha256.update(JSON.stringify(appState), 'utf8').digest()
      cb({ data: appHash })
    }

    let abciServer = new abci.Server(abciApp)
    abciServer.server.listen(abciPort)
    app.listen(port)

    return genesisKey
  }
}
