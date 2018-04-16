let abci = require('./abci/')
let decodeTx = require('./tx-encoding.js').decode
let jsondiffpatch = require('jsondiffpatch')
let getRoot = require('./get-root.js')
let { stringify } = require('./json.js')
let { EventEmitter } = require('events')
let merk = require('merk')

async function runTx(txMiddleware, store, tx, chainInfo, allowMutation = false){
  let stateMutated = false
  // TODO: mutate store then use merk.rollback instead of cloning state
  let newChainInfo = jsondiffpatch.clone(chainInfo)
  let newState = jsondiffpatch.clone(store)
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
    for (let txHandler of txMiddleware) {
      await txHandler(hookedState, tx, hookedChainInfo);
    }
  } catch (e) {
    return [false, e.toString()]
  }
  if (allowMutation) {
    Object.assign(chainInfo, newChainInfo)
    Object.assign(store, newState)
  } else {
    // merk.rollback(store)
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
  setOption(req, cb) {
    cb({})
  }
}

module.exports = function configureABCIServer({
  txMiddleware,
  blockMiddleware,
  store,
  initialAppHash
}) {
  let chainInfo = {
    height: 1,
    validators: {}
  }
  let lastValidatorState = {}
  let abciApp = new AbciApp()
  abciApp.checkTx = async function(req, cb) {
    let rawTx = req.check_tx.tx
    try {
      let tx = decodeTx(rawTx)
      let [isValid, log] = await runTx(txMiddleware, store, tx, chainInfo, false)
      let code = isValid ? 0 : 2
      cb({ code, log })
    } catch (e) {
      cb({ code: 2, log: 'Invalid tx encoding for checkTx' })
    }
  }

  abciApp.deliverTx = async function(req, cb) {
    let rawTx = req.deliver_tx.tx
    try {
      let tx = decodeTx(rawTx)
      let [isValid, log] = await runTx(txMiddleware, store, tx, chainInfo, true)
      if (isValid) {
        cb({ code: 0 })
      } else {
        cb({ code: 2, log })
      }
    } catch (e) {
      cb({ code: 2, log: 'Invalid tx encoding for deliverTx' })
    }
  }

  abciApp.commit = async function(req, cb) {
    chainInfo.height++
    blockMiddleware.forEach(blockHandler => {
      blockHandler(store, chainInfo)
    })
    let appHash = await getRoot(store)
    cb({ data: appHash })
  }

  abciApp.initChain = function(req, cb) {
    let validators = req.initChain.validatorsList
    validators.forEach(tmValidator => {
      let pubKey = tmValidator.pubKey.toString('hex')
      let power = tmValidator.power
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
          pub_key: Buffer.from(key, 'hex'),
          power: { low: chainInfo.validators[key], high: 0 }
        })
      }
    }
    lastValidatorState = Object.assign({}, chainInfo.validators)
    cb({ validator_updates: diffs })
  }

  abciApp.query = async function(req, cb) {
    try {
      let queryResponse = {
        value: stringify(store),
        height: { low: chainInfo.height - 1, high: 0 },
        proof: '',
        key: '',
        index: { low: 0, high: 0 },
        code: 0,
        log: ''
      }
      cb(queryResponse)
    } catch (e) {
      cb({ code: 2, log: 'invalid query: ' + e.message })
    }
  }

  abciApp.info = async function(req, cb) {
    let rootHash = await getRoot(store)
    cb({ lastBlockAppHash: new Uint8Array(rootHash) })
  }
  let abciServer = new abci.Server(abciApp)

  return abciServer.server
}
