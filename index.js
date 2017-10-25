let getPort = require('get-port')
let fs = require('fs')
let memdown = require('memdown')
let level = require('level')
let ABCIServer = require('./lib/abci-app.js')
let TxServer = require('./lib/tx-server.js')
let Tendermint = require('./lib/tendermint.js')
let rimraf = require('rimraf')
let generateNetworkId = require('./lib/network-id.js')
let os = require('os')

const LOTION_HOME = process.env.LOTION_HOME || os.homedir() + '/.lotion'

async function getPorts() {
  let p2pPort = await getPort()
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
  let blockMiddleware = []
  let genesis =
    opts.genesis && fs.readFileSync(opts.genesis, { encoding: 'utf8' })
  let appState = Object.assign({}, initialState)
  let txCache = level({ db: memdown, valueEncoding: 'json' })
  let txStats = { txCountNetwork: 0 }

  let appMethods = {
    use: middleware => {
      if (middleware instanceof Array) {
        middleware.forEach(appMethods.use)
      } else if (typeof middleware === 'function') {
        appMethods.useTx(middleware)
      } else if (middleware.type === 'tx') {
        appMethods.useTx(middleware)
      } else if (middleware.type === 'block') {
        appMethods.useBlock(middleware)
      }
      return appMethods
    },
    useTx: txHandler => {
      txMiddleware.push(txHandler)
    },
    useBlock: blockHandler => {
      blockMiddleware.push(blockHandler)
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
      let { tendermintPort, abciPort, p2pPort } = await getPorts()

      let abciServer = ABCIServer({
        txMiddleware,
        blockMiddleware,
        appState,
        txCache,
        txStats
      })
      abciServer.listen(abciPort)

      const lotionPath = LOTION_HOME + '/networks/' + networkId
      if (devMode) {
        rimraf.sync(lotionPath)
        process.on('SIGINT', () => {
          rimraf.sync(lotionPath)
          process.exit()
        })
      }
      let tendermint = await Tendermint({
        lotionPath,
        tendermintPort,
        abciPort,
        p2pPort,
        logTendermint,
        peers,
        genesis
      })

      let txServer = TxServer({ tendermintPort, appState, txCache, txStats })
      txServer.listen(txServerPort)
    }
  }

  return appMethods
}
