let createABCIServer = require('abci')
let decodeTx = require('./tx-encoding.js').decode
let jsondiffpatch = require('jsondiffpatch')
let getRoot = require('./get-root.js')
let { stringify } = require('deterministic-json')
let { EventEmitter } = require('events')
let merk = require('merk')

async function runTx(
  txMiddleware,
  store,
  tx,
  chainInfo,
  allowMutation = false
) {
  let stateMutated = false
  // TODO: mutate store then use merk.rollback instead of cloning state
  let newChainInfo = jsondiffpatch.clone(chainInfo)
  let newState = jsondiffpatch.clone(store)
  let proxy = {
    get: (target, name) => {
      if (typeof target[name] === 'object' && target[name] !== null) {
        return new Proxy(target[name], proxy)
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
      await txHandler(hookedState, tx, hookedChainInfo)
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
}

module.exports = function configureABCIServer({
  txMiddleware,
  blockMiddleware,
  store,
  storeDb,
  initialAppHash
}) {
  let chainInfo = {
    height: 1,
    validators: {}
  }
  let lastValidatorState = {}
  let abciApp = new AbciApp()
  abciApp.checkTx = async function(req) {
    console.log("checkTx")
    let rawTx = req.tx
    try {
      let tx = decodeTx(rawTx)
      let [isValid, log] = await runTx(
        txMiddleware,
        store,
        tx,
        chainInfo,
        false
      )
      let code = isValid ? 0 : 2
      return { code, log }
    } catch (e) {
      return { code: 2, log: 'Invalid tx encoding for checkTx' }
    }
  }

  abciApp.deliverTx = async function(req) {
    console.log("deliverTx")
    let rawTx = req.tx
    try {
      let tx = decodeTx(rawTx)
      let [isValid, log] = await runTx(
        txMiddleware,
        store,
        tx,
        chainInfo,
        true
      )
      let code = isValid ? 0 : 2
      return { code, log }
    } catch (e) {
      return { code: 2, log: 'Invalid tx encoding for deliverTx' }
    }
  }

  abciApp.initChain = function({ validators }) {
    validators.forEach(tmValidator => {
      // unclear why validator power is sometimes a buffer
      let power = typeof tmValidator.power === 'number'
        ? tmValidator.power
        : tmValidator.power.toNumber()
      chainInfo.validators[tmValidator.pubKey.toString('base64')] = power
    })
    Object.assign(lastValidatorState, chainInfo.validators)
    return {}
  }

  abciApp.beginBlock = function(req) {
    chainInfo.block = req
    return {}
  }

  abciApp.endBlock = function(req) {
    let diffs = []
    for (let key in chainInfo.validators) {
      if (lastValidatorState[key] !== chainInfo.validators[key]) {
        diffs.push({
          pubKey: Buffer.from(key, 'base64'),
          power: { low: chainInfo.validators[key], high: 0 }
        })
      }
    }
    lastValidatorState = Object.assign({}, chainInfo.validators)
    return { validatorUpdates: diffs }
  }

  abciApp.commit = async function() {
    chainInfo.height++
    blockMiddleware.forEach(blockHandler => {
      blockHandler(store, chainInfo)
    })
    let appHash = await getRoot(store)
    let storeObject = JSON.stringify({
      appHash: appHash.toString('hex'),
      store,
      chainInfo
    })
    await storeDb.put(chainInfo.height, storeObject)
    await storeDb.put('lastBlockHeight', chainInfo.height)
    return { data: appHash }
  }

  abciApp.query = async function(req) {
    try {
      let responseState = { store }
      if (req.height != 0) {
        responseState = JSON.parse(await storeDb.get(req.height))
      } else {
        req.height = chainInfo.height - 1
      }

      return {
        value: Buffer.from(stringify(responseState.store)),
        height: req.height,
        proof: '',
        key: '',
        index: 0,
        code: 0,
        log: ''
      }
    } catch (err) {
      if (err.notFound) {
        return { code: 3, log: 'state not found' }
      } else {
        return { code: 2, log: 'invalid query: ' + e.message }
      }
    }
  }

  abciApp.info = async function(req) {
    let lastBlockHeight
    try {
      lastBlockHeight = await storeDb.get('lastBlockHeight')
    } catch(err) {
      lastBlockHeight = 0
    }
    console.log(`lastBlockHeight: ${lastBlockHeight}`)

    let lastState = {}
    try {
      lastState = JSON.parse(await storeDb.get(lastBlockHeight))
    } catch(err) {
      lastState.store = store
    }
    console.log(JSON.stringify(lastState, null, 2))

    let rootHash = await getRoot(lastState.store)
    console.log(rootHash.toString('hex'))
    Object.assign(store, lastState.store)
    chainInfo.height = lastBlockHeight
    return { lastBlockAppHash: rootHash, lastBlockHeight }
  }

  let abciServer = createABCIServer(abciApp)
  return abciServer
}
