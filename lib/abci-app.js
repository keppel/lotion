let createHash = require('sha.js')
let abci = require('./abci/')
let stringify = require('json-stable-stringify')
let decodeTx = require('./tx-encoding.js').decode

function getAppStateHash(appState) {
  let sha256 = createHash('sha256')
  // unless a merkle store is used, this will get slow when the state is big:
  return sha256.update(stringify(appState), 'utf8').digest()
}

function runTx(txHandler, appState, tx, chainInfo, allowMutation = false) {
  let stateMutated = false
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
      if (allowMutation) {
        target[name] = newValue
      }
      if (newValue !== oldValue) {
        stateMutated = true
      }
      return true
    }
  }
  let hookedState = new Proxy(appState, proxy)
  let hookedChainInfo = new Proxy(chainInfo, proxy)
  txHandler(hookedState, tx, hookedChainInfo)
  return stateMutated
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

function noop() {}

module.exports = function configureABCIServer(
  txHandler,
  blockHandler = noop,
  appState,
  txCache,
  txStats
) {
  let chainInfo = {
    height: 0,
    validators: {
      // map public key to voting power.
      // not sure if address is required.
    }
  }
  let lastValidatorState = {}
  let abciApp = new AbciApp()

  abciApp.checkTx = function(req, cb) {
    let rawTx = req.check_tx.tx.toBuffer()
    let tx = decodeTx(rawTx)
    let isValid = runTx(txHandler, appState, tx, chainInfo, false)
    let code = isValid ? abci.CodeType.OK : abci.CodeType.EncodingError
    cb({ code })
  }

  abciApp.deliverTx = function(req, cb) {
    let rawTx = req.deliver_tx.tx.toBuffer()
    let tx = decodeTx(rawTx)
    let isValid = runTx(txHandler, appState, tx, chainInfo, true)
    if (isValid) {
      cb({ code: abci.CodeType.OK })
      txCache.put(txStats.txCountNetwork, tx, (err, doc) => {})
      txStats.txCountNetwork++
    } else {
      cb({ code: abci.CodeType.EncodingError })
    }
  }

  abciApp.commit = function(req, cb) {
    chainInfo.height++
    blockHandler(appState, chainInfo)
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
