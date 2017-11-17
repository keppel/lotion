let getPort = require('get-port')
let fs = require('fs')
let memdown = require('memdown')
let level = require('level')
let ABCIServer = require('./lib/abci-app.js')
let TxServer = require('./lib/tx-server.js')
let Tendermint = require('./lib/tendermint.js')
let rimraf = require('rimraf')
let generateNetworkId = require('./lib/network-id.js')
let getNodeInfo = require('./lib/node-info.js')
let os = require('os')

const LOTION_HOME = process.env.LOTION_HOME || os.homedir() + '/.lotion'

async function getPorts(peeringPort) {
  let p2pPort = peeringPort || (await getPort(peeringPort))
  let tendermintPort = await getPort()
  let abciPort = await getPort()

  return { tendermintPort, abciPort, p2pPort }
}

module.exports = function Lotion(opts = {}) {
  let initialState = opts.initialState || {}
  let peers = opts.peers || []
  let logTendermint = opts.logTendermint || false
  let devMode = opts.devMode || false
  let txMiddleware = []
  let peeringPort = opts.p2pPort
  let blockMiddleware = []
  let txEndpoints = []
  let keys =
    typeof opts.keys === 'string' &&
    JSON.parse(fs.readFileSync(opts.keys, { encoding: 'utf8' }))
  let genesis =
    opts.genesis && fs.readFileSync(opts.genesis, { encoding: 'utf8' })
  let appState = Object.assign({}, initialState)
  let txCache = level({ db: memdown, valueEncoding: 'json' })
  let txStats = { txCountNetwork: 0 }
  let abciServer
  let tendermint
  let txHTTPServer

  let appMethods = {
    use: middleware => {
      if (middleware instanceof Array) {
        middleware.forEach(appMethods.use)
      } else if (typeof middleware === 'function') {
        appMethods.useTx(middleware)
      } else if (middleware.type === 'tx') {
        appMethods.useTx(middleware.middleware)
      } else if (middleware.type === 'block') {
        appMethods.useBlock(middleware.middleware)
      } else if (middleware.type === 'tx-endpoint') {
        appMethods.useTxEndpoint(middleware.path, middleware.middleware)
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
    listen: async txServerPort => {
      const networkId =
        opts.networkId ||
        generateNetworkId(
          txMiddleware,
          blockMiddleware,
          initialState,
          devMode,
          genesis
        )
      // set up abci server, then tendermint node, then tx server
      let { tendermintPort, abciPort, p2pPort } = await getPorts(peeringPort)

      abciServer = ABCIServer({
        txMiddleware,
        blockMiddleware,
        appState,
        txCache,
        txStats
      })
      abciServer.listen(abciPort)

      let lotionPath = LOTION_HOME + '/networks/' + networkId
      if (devMode) {
        lotionPath += Math.floor(Math.random() * 1e9)
        rimraf.sync(lotionPath)
        process.on('SIGINT', () => {
          rimraf.sync(lotionPath)
          process.exit()
        })
      }
      tendermint = await Tendermint({
        lotionPath,
        tendermintPort,
        abciPort,
        p2pPort,
        logTendermint,
        networkId,
        peers,
        genesis,
        keys
      })

      let nodeInfo = await getNodeInfo(lotionPath)
      let txServer = TxServer({
        tendermintPort,
        appState,
        nodeInfo,
        txEndpoints,
        txCache,
        txStats,
        port: txServerPort
      })
      txHTTPServer = txServer.listen(txServerPort)
    },
    close: () => {
      abciServer.close()
      tendermint.close()
      txHTTPServer.close()
    }
  }

  return appMethods
}
