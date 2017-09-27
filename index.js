let { promisify } = require('util')
let express = require('express')
let { json } = require('body-parser')
let axios = require('axios')
let { spawn } = require('child_process')
let getPort = require('get-port')
let tmBin = __dirname + '/bin/tendermint'
let stringify = require('json-stable-stringify')
let level = require('level')
let memdown = require('memdown')
let fs = require('fs')
let readFile = promisify(fs.readFile)
let writeFile = promisify(fs.writeFile)
let Dat = promisify(require('dat-node'))
let swarm = require('discovery-swarm')
let rimraf = promisify(require('rimraf'))
let encodeTx = require('./lib/tx-encoding.js').encode

let configureABCIServer = require('./lib/abci-app.js')

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

function getInitialPeers(peerSwarm) {
  return new Promise((resolve, reject) => {
    const PEER_TIMEOUT = 4000
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
    }, PEER_TIMEOUT)
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
  let tendermintPath = opts.path || './lotion-data'
  let sharedDir = tendermintPath + '/shared'

  let initialState = opts.initialState
  if (!initialState) {
    let stateFilePath = sharedDir + '/initial-state.json'
    if (fs.existsSync(stateFilePath)) {
      initialState = JSON.parse(fs.readFileSync(stateFilePath))
    } else {
      initialState = {}
    }
  }

  let store = opts.store
  let port = opts.port || 3001
  let peers = opts.peers || []

  return async function createServer(stateMachine) {
    let txCache = level({ db: memdown, valueEncoding: 'json' })
    let txStats = {
      txCountNetwork: 0
    }

    let { tendermintPort, abciPort, p2pPort } = await getPorts()
    let genesisKey = opts.genesisKey

    let appState = Object.assign({}, initialState)
    await initNode(tendermintPath)

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
      appState = JSON.parse(initialStateJson)

      // if initial state provided, make sure it matches the one from the genesis key
      if (opts.initialState) {
        if (initialStateJson !== stringify(initialState)) {
          throw new Error('genesis key does not match provided initial state')
        }
      }
    } else {
      // this is an initial validator node, serve genesis dat archive
      let dat = await Dat(sharedDir)
      let genesisJson = await readFile(tendermintPath + '/genesis.json')

      await writeFile(
        sharedDir + '/initial-state.json',
        stringify(initialState)
      )
      await writeFile(sharedDir + '/tm-genesis.json', genesisJson)
      dat.importFiles()
      dat.joinNetwork()
      genesisKey = dat.key.toString('hex')
    }

    let abciServer = configureABCIServer(
      stateMachine,
      appState,
      txCache,
      txStats
    )
    abciServer.listen(abciPort)

    // start tx server
    let app = express()
    app.use(json())
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

    app.listen(port)

    let waitForSync = new Promise((resolve, reject) => {
      const SYNC_POLL_INTERVAL = 1000

      let interval = setInterval(async () => {
        let tmStatus = await axios
          .get(`http://localhost:${tendermintPort}/status`)
          .then(res => res.data.result)
          .catch(e => {})

        if (tmStatus && tmStatus.syncing === false) {
          resolve()
          clearInterval(interval)
        }
      }, SYNC_POLL_INTERVAL)
    })

    await waitForSync

    return genesisKey
  }
}
