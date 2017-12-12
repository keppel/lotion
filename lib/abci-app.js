let abci = require('./abci/')
let { stringify, convertBuffersToBase64 } = require('./json.js')
let decodeTx = require('./tx-encoding.js').decode
let decodeQuery = require('./query-encoding.js').decode
let jsondiffpatch = require('jsondiffpatch')
let getRoot = require('./get-root.js')
let { EventEmitter } = require('events')

function runTx(txMiddleware, appState, tx, chainInfo, allowMutation = false) {
  let stateMutated = false
  let newState = jsondiffpatch.clone(appState)
  let newChainInfo = jsondiffpatch.clone(chainInfo)

  let proxy = {
    get: (target, name) => {
      if (typeof target[name] === 'object' && target[name] !== null) {
        return new Proxy(target[name], proxy)
      } else {
        return target[name]
      }
      return target[name]
    },
    set: (target, name, newValue) => {
      let oldValue = target[name]
      target[name] = newValue
      if (newValue !== oldValue) {
        stateMutated = true
      }
      return true
    }
  }
  let hookedState = new Proxy(newState, proxy)
  let hookedChainInfo = new Proxy(chainInfo, proxy)
  // run middleware stack
  try {
    txMiddleware.forEach(txHandler => {
      txHandler(hookedState, tx, hookedChainInfo)
    })
  } catch (e) {
    return [false, e.toString()]
  }
  if (allowMutation) {
    Object.assign(appState, newState)
    Object.assign(chainInfo, newChainInfo)
  }
  return [
    stateMutated,
    stateMutated ? '' : 'transaction must mutate state to be valid'
  ]
}

class AbciApp {
  constructor() {}
  beginBlock(req, cb) {
    cb({})
  }
}

function noop() {}

module.exports = function configureABCIServer({
  txMiddleware,
  blockMiddleware,
  appState,
  txCache,
  txStats,
  initialAppHash
}) {
  let chainInfo = {
    height: 1,
    validators: {}
  }
  let lastValidatorState = {}
  let lastCommittedHash = initialAppHash
  let lastCommittedState = jsondiffpatch.clone(appState)
  let bus = new EventEmitter()
  let abciApp = new AbciApp()
  abciApp.checkTx = function(req, cb) {
    let rawTx = req.check_tx.tx
    let tx = decodeTx(rawTx)
    let [isValid, log] = runTx(txMiddleware, appState, tx, chainInfo, false)
    let code = isValid ? 0 : 2

    cb({ code, log })
  }

  abciApp.deliverTx = function(req, cb) {
    let rawTx = req.deliver_tx.tx
    let tx = decodeTx(rawTx)
    let [isValid, log] = runTx(txMiddleware, appState, tx, chainInfo, true)
    if (isValid) {
      cb({ code: 0 })
      convertBuffersToBase64(tx)
      txCache.put(txStats.txCountNetwork, tx, (err, doc) => {})
      txStats.txCountNetwork++
    } else {
      cb({ code: 2, log })
    }
  }

  let patch
  abciApp.commit = function(req, cb) {
    chainInfo.height++
    blockMiddleware.forEach(blockHandler => {
      blockHandler(appState, chainInfo)
    })
    appHash = getRoot(appState)
    cb({ data: appHash })
    patch = jsondiffpatch.diff(lastCommittedState, appState)
    lastCommittedState = jsondiffpatch.clone(appState)
  }

  abciApp.initChain = function(req, cb) {
    let validators = req.init_chain.validators
    validators.forEach(tmValidator => {
      let pubKey = tmValidator.pub_key.toString('hex')
      let power = tmValidator.power.toNumber()
      chainInfo.validators[pubKey] = power
    })
    Object.assign(lastValidatorState, chainInfo.validators)
    cb({})
  }

  abciApp.endBlock = function(req, cb) {
    let diffs = []
    for (let key in chainInfo.validators) {
      if (lastValidatorState[key] !== chainInfo.validators[key]) {
        diffs.push({
          pubKey: Buffer.from(key, 'hex'),
          power: chainInfo.validators[key]
        })
      }
    }
    lastValidatorState = Object.assign({}, chainInfo.validators)
    cb({ diffs })
  }

  abciApp.query = function(req, cb) {
    let query = decodeQuery(req.query.data)
    // by default, return the whole state to the query
    let stateToHash = jsondiffpatch.clone(lastCommittedState)
    jsondiffpatch.unpatch(stateToHash, patch)

    let queryResponse = {
      value: Buffer.from(stringify(stateToHash)),
      height: { low: chainInfo.height - 1, high: 0 }
      // todo: proofs.
    }

    cb(queryResponse)
  }

  abciApp.info = function(req, cb) {
    cb({ last_block_app_hash: getRoot(appState) })
  }
  let abciServer = new abci.Server(abciApp)

  return abciServer.server
}
