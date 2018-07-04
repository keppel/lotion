let getPort = require('get-port')
let fs = require('fs-extra')
let level = require('level')
let { join } = require('path')
let ABCIServer = require('./lib/abci-app.js')
let TxServer = require('./lib/tx-server.js')
let Tendermint = require('./lib/tendermint.js')
let rimraf = require('rimraf')
let generateNetworkId = require('./lib/network-id.js')
let getNodeInfo = require('./lib/node-info.js')
let getRoot = require('./lib/get-root.js')
let serveGenesisGCI = require('./lib/gci-serve-genesis.js')
let announceSelfAsFullNode = require('./lib/gci-announce-self.js')
let os = require('os')
let axios = require('axios')
let merk = require('merk')
let { EventEmitter } = require('events')
let isElectron = require('is-electron')

const LOTION_HOME = process.env.LOTION_HOME || join(os.homedir(), '.lotion')

if (isElectron()) {
  axios.defaults.adapter = require('axios/lib/adapters/http')
}

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
  let devMode = process.env.DEV_MODE === 'true' || opts.devMode || false
  let unsafeRpc = process.env.UNSAFE_RPC === 'true' || opts.unsafeRpc
  let txMiddleware = []
  let queryMiddleware = []
  let initializerMiddleware = []
  let blockMiddleware = []
  let postListenMiddleware = []
  let txEndpoints = []
  let keys = typeof opts.keys === 'string'
    ? JSON.parse(fs.readFileSync(opts.keys, { encoding: 'utf8' }))
    : opts.keys

  if (process.env.GENESIS_PATH) {
    opts.genesis = process.env.GENESIS_PATH
  }

  let genesis = typeof opts.genesis === 'string'
    ? JSON.parse(getGenesis(opts.genesis))
    : opts.genesis

  let appState = Object.assign({}, initialState)
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
        let lotionPath = join(LOTION_HOME, 'networks', networkId)
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
        let merkDb = level(join(lotionPath, 'merk'))
        let store = await merk(merkDb)

        let tendermintRpcUrl = `http://localhost:${tendermintPort}`

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
            keys,
            initialAppHash,
            unsafeRpc
          })
        } catch (e) {
          console.log('error starting tendermint node:')
          console.log(e)
        }

        await tendermint.synced

        // serve genesis.json and get GCI
        let genesisJson = fs.readFileSync(
          join(lotionPath, 'config', 'genesis.json'),
          'utf8'
        )
        let { GCI } = serveGenesisGCI(genesisJson)

        announceSelfAsFullNode({ GCI, tendermintPort })
        let nodeInfo = await getNodeInfo(lotionPath)
        nodeInfo.GCI = GCI
        let txServer = TxServer({
          tendermintRpcUrl,
          store,
          nodeInfo,
          txEndpoints,
          port: txServerPort
        })
        txHTTPServer = txServer.listen(txServerPort, 'localhost', function() {
          // add some references to useful variables to app object.
          appInfo = {
            tendermintPort,
            abciPort,
            txServerPort,
            GCI,
            p2pPort,
            lotionPath,
            genesisPath: join(lotionPath, 'config', 'genesis.json')
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

Lotion.connect = require('lotion-connect')

module.exports = Lotion
