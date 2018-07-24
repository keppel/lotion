let createABCIServer = require('abci')
let decodeTx = require('./tx-encoding.js').decode
let jsondiffpatch = require('jsondiffpatch')
let getRoot = require('./get-root.js')
let { stringify } = require('deterministic-json')
let { EventEmitter } = require('events')
let merk = require('merk')
let to = require('await-to-js').to

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
  diffDb,
  initialAppHash
}) {
  let chainInfo = {
    height: 1,
    validators: {}
  }
  let lastValidatorState = {}
  let abciApp = new AbciApp()
  abciApp.checkTx = async function(req) {
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

    let lastBlockHeight
    try {
      lastBlockHeight = await storeDb.get('lastBlockHeight')
    } catch(err) {
      lastBlockHeight = 0
    }
    let lastState
    try {
      lastState = JSON.parse(await storeDb.get(lastBlockHeight))
    } catch(err) {
      lastState = { store }
    }

    let diff = jsondiffpatch.diff(lastState.store, store)
    if (diff) {
      // console.log(`\nLASTSTATE ${lastBlockHeight}\n`)
      // console.log(JSON.stringify(lastState.store, null, 2))
      // console.log(`\nSTATE ${chainInfo.height}\n`)
      // console.log(JSON.stringify(store, null, 2))
      // console.log(`\nDIFF ${lastBlockHeight} --> ${chainInfo.height}\n`)
      // console.log(JSON.stringify(diff, null, 2))
      let [err, response] = await to(diffDb.put(chainInfo.height, JSON.stringify(diff)))
      if (err) console.log("Error saving diff.")
    }


    // Store storeObject in storeDB
    let storeObject = JSON.stringify({
      appHash: appHash.toString('hex'),
      store,
      chainInfo
    })

    let [err, response] = await to(storeDb.put(chainInfo.height, storeObject))
    if (err) {
      // console.log("Error storing storeObject")
    } else {
      let [err, reponse] = await to(storeDb.put('lastBlockHeight', chainInfo.height))
      if (err) {
        // console.log("Error storing lastBlockHeight")
      } else {
        // console.log("Success storing storeObject and lastBlockHeight")
        if (chainInfo.height > 2) {
          let [err, response] = await to(storeDb.del((chainInfo.height-2)))
          if (err) {
            // console.log("Error deleting storeObject from two heights ago...")
          }
        }
      }
    }

    return { data: appHash }
  }

  abciApp.query = async function(req) {
    console.log(req)

    let pathInObject = function(obj, path='') {
      let arguments = path.split('.')
      for (var i = 0; i < arguments.length; i++) {
        if (!obj.hasOwnProperty(arguments[i])) {
          return false
        }
        obj = obj[arguments[i]]
      }
      return true
    }

    let resolve = function(obj, path='') {
      path = path.split('.')
      var current = obj
      while(path.length) {
        if(typeof current !== 'object') return undefined
        current = current[path.shift()]
      }
      return current
    }

    if (req.path=="diff") {
      req.height = (req.height!=0) ? req.height : (chainInfo.height - 1)
      let [err, response] = await to(diffDb.get(req.height))
      if (err) {
        if (err.notFound) {
          return { code: 3, log: 'diff not found' }
        } else {
          return { code: 2, log: 'invalid query: ' + e.message }
        }
      } else {
        return {
          value: Buffer.from(response),
          height: req.height,
          proof: '',
          key: '',
          index: 0,
          code: 0,
          log: `path: '${req.path||'*'}', block: ${req.height}`
        }
      }
    } else {
      try {
        let state = { store }
        if (req.height != 0) {
          state = JSON.parse(await storeDb.get(req.height))
        } else {
          req.height = chainInfo.height - 1
        }

        let response = state.store
        if (pathInObject(state.store, req.path)) {
          response = resolve(state.store, req.path)
        }

        return {
          value: Buffer.from(stringify(response)),
          height: req.height,
          proof: '',
          key: '',
          index: 0,
          code: 0,
          log: `path: 'state.${req.path||'*'}', block: ${req.height}`
        }
      } catch (err) {
        if (err.notFound) {
          return { code: 3, log: 'state not found' }
        } else {
          return { code: 2, log: 'invalid query: ' + e.message }
        }
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
    let lastState
    try {
      lastState = JSON.parse(await storeDb.get(lastBlockHeight))
    } catch(err) {
      lastState = { store }
    }
    let rootHash = await getRoot(lastState.store)
    Object.assign(store, lastState.store)
    chainInfo.height = lastBlockHeight

    if (lastBlockHeight>0) {
      console.log(`Continuing blockchain from:`)
      console.log(`lastBlockHeight: ${lastBlockHeight}`)
      console.log(`lastBlockAppHash: ${rootHash.toString('hex')}`)
      // console.log(JSON.stringify(lastState, null, 2))
    }

    return { lastBlockAppHash: rootHash, lastBlockHeight }
  }

  let abciServer = createABCIServer(abciApp)
  return abciServer
}
