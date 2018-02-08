let getPort = require('get-port')
let fs = require('fs-extra')
let memdown = require('memdown')
let level = require('level')
let ABCIServer = require('./lib/abci-app.js')
let TxServer = require('./lib/tx-server.js')
let Tendermint = require('./lib/tendermint.js')
let TendermintLite = require('./lib/tendermint-lite.js')
let rimraf = require('rimraf')
let generateNetworkId = require('./lib/network-id.js')
let getNodeInfo = require('./lib/node-info.js')
let getRoot = require('./lib/get-root.js')
let getGenesisRPC = require('./lib/get-genesis-rpc.js')
let getGenesisGCI = require('./lib/gci-get-genesis.js')
let getGCIFromGenesis = require('./lib/get-gci-from-genesis.js')
let serveGenesisGCI = require('./lib/gci-serve-genesis.js')
let announceSelfAsFullNode = require('./lib/gci-announce-self.js')
let getPeerGCI = require('./lib/gci-get-peer.js')
let os = require('os')
let axios = require('axios')
let merk = require('merk')
let { EventEmitter } = require('events')

const LOTION_HOME = process.env.LOTION_HOME || os.homedir() + '/.lotion'

async function getPorts(peeringPort, rpcPort, abciAppPort) {
  let p2pPort =
    process.env.P2P_PORT || peeringPort || (await getPort(peeringPort))
  let tendermintPort =
    process.env.TENDERMINT_PORT || rpcPort || (await getPort(rpcPort))
  let abciPort = process.env.ABCI_PORT || abciAppPort || (await getPort())

  return { tendermintPort, abciPort, p2pPort }
}

function getGenesis(genesisPath) {
  return fs.readFileSync(genesisPath, { encoding: 'utf8' })
}

function Lotion(opts = {}) {
  let initialState = opts.initialState || {}
  let peers = opts.peers || []
  let logTendermint = opts.logTendermint || false
  let createEmptyBlocks = typeof opts.createEmptyBlocks === 'undefined'
    ? true
    : opts.createEmptyBlocks
  let target = opts.target
  let devMode = opts.devMode || false
  let lite = opts.lite || false
  let unsafeRpc = opts.unsafeRpc
  let txMiddleware = []
  let queryMiddleware = []
  let initializerMiddleware = []
  let blockMiddleware = []
  let postListenMiddleware = []
  let txEndpoints = []
  if (lite) {
    Tendermint = TendermintLite
  }
  let keys =
    typeof opts.keys === 'string' &&
    JSON.parse(fs.readFileSync(opts.keys, { encoding: 'utf8' }))
  let genesis = typeof opts.genesis === 'string'
    ? JSON.parse(getGenesis(opts.genesis))
    : opts.genesis

  let appState = Object.assign({}, initialState)
  let txCache = level({ db: memdown, valueEncoding: 'json' })
  let txStats = { txCountNetwork: 0 }
  let bus = new EventEmitter()
  let appInfo
  let abciServer
  let tendermint
  let txHTTPServer

  bus.on('listen', () => {
    postListenMiddleware.forEach(f => {
      f(appInfo)
    })
  })

  let appMethods = {
    use: middleware => {
      if (middleware instanceof Array) {
        middleware.forEach(appMethods.use)
      } else if (typeof middleware === 'function') {
        appMethods.useTx(middleware)
      } else if (middleware.type === 'tx') {
        appMethods.useTx(middleware.middleware)
      } else if (middleware.type === 'query') {
        appMethods.useQuery(middleware.middleware)
      } else if (middleware.type === 'block') {
        appMethods.useBlock(middleware.middleware)
      } else if (middleware.type === 'initializer') {
        appMethods.useInitializer(middleware.middleware)
      } else if (middleware.type === 'tx-endpoint') {
        appMethods.useTxEndpoint(middleware.path, middleware.middleware)
      } else if (middleware.type === 'post-listen') {
        appMethods.usePostListen(middleware.middleware)
      }
      return appMethods
    },
    useTx: txHandler => {
      txMiddleware.push(txHandler)
    },
    useBlock: blockHandler => {
      blockMiddleware.push(blockHandler)
    },
    useTxEndpoint: (path, txEndpoint) => {
      txEndpoints.push({ path: path.toLowerCase(), middleware: txEndpoint })
    },
    useQuery: queryHandler => {
      queryMiddleware.push(queryHandler)
    },
    useInitializer: initializer => {
      initializerMiddleware.push(initializer)
    },
    usePostListen: postListener => {
      // TODO: rename "post listen", there's probably a more descriptive name.
      postListenMiddleware.push(postListener)
    },
    listen: txServerPort => {
      return new Promise(async (resolve, reject) => {
        const networkId =
          opts.networkId ||
          generateNetworkId(
            txMiddleware,
            blockMiddleware,
            queryMiddleware,
            initializerMiddleware,
            initialState,
            devMode,
            genesis
          )
        // set up abci server, then tendermint node, then tx server
        let { tendermintPort, abciPort, p2pPort } = await getPorts(
          opts.p2pPort,
          opts.tendermintPort,
          opts.abciPort
        )
        let lotionPath = LOTION_HOME + '/networks/' + networkId
        if (devMode) {
          lotionPath += Math.floor(Math.random() * 1e9)
          rimraf.sync(lotionPath)
          process.on('SIGINT', () => {
            rimraf.sync(lotionPath)
            process.exit()
          })
        }
        await fs.mkdirp(lotionPath)

        // initialize merk store
        let merkDb = level(lotionPath + '/merk')
        let store = await merk(merkDb)

        let tendermintRpcUrl = target || `http://localhost:${tendermintPort}`

        initializerMiddleware.forEach(initializer => {
          initializer(appState)
        })
        Object.assign(store, appState)
        let initialAppHash = (await getRoot(store)).toString('hex')
        abciServer = ABCIServer({
          txMiddleware,
          blockMiddleware,
          queryMiddleware,
          initializerMiddleware,
          store,
          initialAppHash
        })
        abciServer.listen(abciPort, 'localhost')

        try {
          tendermint = await Tendermint({
            lotionPath,
            tendermintPort,
            abciPort,
            p2pPort,
            logTendermint,
            createEmptyBlocks,
            networkId,
            peers,
            genesis,
            target,
            keys,
            initialAppHash,
            unsafeRpc
          })
        } catch (e) {
          console.log('error starting tendermint node:')
          console.log(e)
        }

        // serve genesis.json and get GCI
        let GCI
        if (!lite) {
          let genesisJson = await getGenesisRPC(
            'http://localhost:' + tendermintPort
          )
          GCI = getGCIFromGenesis(genesisJson)
          serveGenesisGCI(GCI, genesisJson)
        }
        await tendermint.synced
        if (!lite) {
          announceSelfAsFullNode({ GCI, tendermintPort })
        }

        let nodeInfo = await getNodeInfo(lotionPath, opts.lite)
        nodeInfo.GCI = GCI
        let txServer = TxServer({
          tendermintRpcUrl,
          appState,
          nodeInfo,
          txEndpoints,
          txCache,
          txStats,
          port: txServerPort
        })
        txHTTPServer = txServer.listen(txServerPort, 'localhost', function() {
          // add some references to useful variables to app object.
          appInfo = {
            tendermintPort,
            abciPort,
            txServerPort,
            GCI: GCI,
            p2pPort,
            lotionPath,
            genesisPath: lotionPath + '/genesis.json',
            lite
          }

          bus.emit('listen')
          resolve(appInfo)
        })
      })
    },
    close: () => {
      abciServer.close()
      tendermint.close()
      txHTTPServer.close()
    }
  }

  return appMethods
}

let tendermint = require('tendermint')
let txEncoding = require('./lib/tx-encoding.js')
let { parse } = require('./lib/json.js')

function waitForHeight(height, lc) {
  return new Promise((resolve, reject) => {
    function handleUpdate(header) {
      if (header.height >= height) {
        resolve()
        lc.removeListener('update', handleUpdate)
      }
    }

    lc.on('update', handleUpdate)
  })
}

Lotion.connect = function(GCI, opts = {}) {
  return new Promise(async (resolve, reject) => {
    let nodes = opts.nodes || []
    // get genesis
    let genesis = opts.genesis

    if (!genesis) {
      try {
        genesis = JSON.parse(await getGenesisGCI(GCI))
      } catch (e) {
        return console.log('invalid genesis.json from GCI')
      }
    }
    // get a full node to connect to
    // use a peer from opts.peers if available. fall back to dht lookup.

    let fullNodeRpcAddress
    if (nodes.length) {
      // randomly sample from supplied seed nodes
      let randomIndex = Math.floor(Math.random() * nodes.length)
      fullNodeRpcAddress = nodes[randomIndex]
    } else {
      fullNodeRpcAddress = await getPeerGCI(GCI)
    }

    let clientState = {
      validators: genesis.validators,
      commit: null,
      header: { height: 1, chain_id: genesis.chain_id }
    }
    let lc = tendermint(fullNodeRpcAddress, clientState)
    let rpc = tendermint.RpcClient(fullNodeRpcAddress)
    let appHashByHeight = {}

    lc.on('update', function(header, commit, validators) {
      let appHash = header.app_hash
      appHashByHeight[header.height] = appHash
    })
    let bus = new EventEmitter()
    rpc.subscribe({ query: "tm.event = 'NewBlockHeader'" }, function() {
      bus.emit('block')
    })
    resolve({
      getState: async function() {
        let queryResponse = await axios
          .get(`${fullNodeRpcAddress}/abci_query?data=""&opts={"trusted":true}`)
          .catch(e => {
            console.log(e)
          })
        let resp = queryResponse.data.result.response
        let value = parse(Buffer.from(resp.value, 'hex').toString())
        await waitForHeight(resp.height, lc)
        let responseAppHash = getRoot(value).toString('hex').toUpperCase()

        if (responseAppHash === appHashByHeight[resp.height]) {
          return value
        } else {
          throw Error('invalid state from full node')
        }
      },
      send: function(tx) {
        return new Promise((resolve, reject) => {
          let nonce = Math.floor(Math.random() * (2 << 12))
          let txBytes = '0x' + txEncoding.encode(tx, nonce).toString('hex')

          axios
            .get(
              `${fullNodeRpcAddress.replace('ws:', 'http:')}/broadcast_tx_commit`,
              {
                params: {
                  tx: txBytes
                }
              }
            )
            .then(res => {
              bus.once('block', function() {
                bus.once('block', function() {
                  resolve(res.data.result)
                })
              })
            })
            .catch(e => {
              console.log('error broadcasting transaction:')
              console.log(e)
            })
        })
      }
    })
  })
}

module.exports = Lotion
