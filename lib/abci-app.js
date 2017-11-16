let createHash = require('sha.js')
let abci = require('./abci/')
let { stringify, convertBuffersToBase64 } = require('./json.js')
let decodeTx = require('./tx-encoding.js').decode
let jsondiffpatch = require('jsondiffpatch')

function getAppStateHash(appState) {
  let sha256 = createHash('sha256')
  // unless a merkle store is used, this will get slow when the state is big:
  return sha256.update(stringify(appState), 'utf8').digest()
}

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
  return [stateMutated, '']
}

class AbciApp {
  constructor() {}
  info(req, cb) {
    cb()
  }
  beginBlock(req, cb) {
    cb()
  }
}

function noop() {}

module.exports = function configureABCIServer({
  txMiddleware,
  blockMiddleware,
  appState,
  txCache,
  txStats
}) {
  let chainInfo = {
    height: 0,
    validators: {}
  }
  let lastValidatorState = {}
  let abciApp = new AbciApp()
  abciApp.checkTx = function(req, cb) {
    let rawTx = req.check_tx.tx.toBuffer()
    let tx = decodeTx(rawTx)
    let [isValid, log] = runTx(txMiddleware, appState, tx, chainInfo, false)
    let code = isValid ? abci.CodeType.OK : abci.CodeType.EncodingError

    cb({ code, log })
  }

  abciApp.deliverTx = function(req, cb) {
    let rawTx = req.deliver_tx.tx.toBuffer()
    let tx = decodeTx(rawTx)
    let [isValid, log] = runTx(txMiddleware, appState, tx, chainInfo, true)
    if (isValid) {
      cb({ code: abci.CodeType.OK })
      convertBuffersToBase64(tx)
      txCache.put(txStats.txCountNetwork, tx, (err, doc) => {})
      txStats.txCountNetwork++
    } else {
      cb({ code: abci.CodeType.EncodingError, log })
    }
  }

  abciApp.commit = function(req, cb) {
    chainInfo.height++
    blockMiddleware.forEach(blockHandler => {
      blockHandler(appState, chainInfo)
    })
    appHash = getAppStateHash(appState)
    cb({ data: appHash })
  }

  abciApp.initChain = function(req, cb) {
    let validators = req.init_chain.validators
    validators.forEach(tmValidator => {
      let pubKey = tmValidator.pubKey.toHex()
      let power = tmValidator.power.toNumber()
      chainInfo.validators[pubKey] = power
    })
    Object.assign(lastValidatorState, chainInfo.validators)
    cb()
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

  let abciServer = new abci.Server(abciApp)

  return abciServer.server
}
