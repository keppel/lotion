let abci = require('./abci/')
let { stringify, convertBuffersToBase64 } = require('./json.js')
let decodeTx = require('./tx-encoding.js').decode
let jsondiffpatch = require('jsondiffpatch')
let getRoot = require('./get-root.js')
let { EventEmitter } = require('events')
let merk = require('merk')

function runTx(txMiddleware, store, tx, chainInfo, allowMutation = false) {
  let stateMutated = false
  let newState = jsondiffpatch.clone(store)
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
    Object.assign(store, newState)
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
  setOption(req, cb) {
    cb({})
  }
}

function noop() {}

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
  let lastCommittedHash = initialAppHash
  let lastCommittedState = jsondiffpatch.clone(store)
  let bus = new EventEmitter()
  let abciApp = new AbciApp()
  abciApp.checkTx = function(req, cb) {
    let rawTx = req.check_tx.tx
    try {
      let tx = decodeTx(rawTx)
      let [isValid, log] = runTx(txMiddleware, store, tx, chainInfo, false)
      let code = isValid ? 0 : 2
      cb({ code, log })
    } catch (e) {
      cb({ code: 2, log: 'Invalid tx encoding for checkTx' })
    }
  }

  abciApp.deliverTx = function(req, cb) {
    let rawTx = req.deliver_tx.tx
    try {
      let tx = decodeTx(rawTx)
      let [isValid, log] = runTx(txMiddleware, store, tx, chainInfo, true)
      if (isValid) {
        cb({ code: 0 })
        convertBuffersToBase64(tx)
      } else {
        cb({ code: 2, log })
      }
    } catch (e) {
      cb({ code: 2, log: 'Invalid tx encoding for deliverTx' })
    }
  }

  let patch
  abciApp.commit = async function(req, cb) {
    chainInfo.height++
    blockMiddleware.forEach(blockHandler => {
      blockHandler(store, chainInfo)
    })
    let appHash = await getRoot(store)
    cb({ data: appHash })
    patch = jsondiffpatch.diff(lastCommittedState, store)
    lastCommittedState = jsondiffpatch.clone(store)
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

  abciApp.query = async function(req, cb) {
    try {
      let path = req.query.path || ''
      let rootHash = (await getRoot(store)).toString('hex').toLowerCase()
      let proof = await merk.proof(store, path)
      let queryResponse = {
        value: '',
        height: { low: chainInfo.height - 1, high: 0 },
        proof: JSON.stringify(proof),
        key: path,
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
    cb({ last_block_app_hash: rootHash })
  }
  let abciServer = new abci.Server(abciApp)

  return abciServer.server
}
