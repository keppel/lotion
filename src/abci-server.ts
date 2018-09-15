import djson = require('deterministic-json')
import vstruct = require('varstruct')
import { createHash } from 'crypto'

let to = require('await-to-js').to
import jsondiffpatch = require('jsondiffpatch')

let createServer = require('abci')

export interface ABCIServer {
  listen(port)
}

export default function createABCIServer(stateMachine, initialState, storeDb, diffDb): any {
  let height = 0
  let abciServer = createServer({
    async info(request) {
      let appState = initialState
      console.log(JSON.stringify(request, null, 2))
      let lastBlockHeight
      try {
        lastBlockHeight = await storeDb.get('lastBlockHeight')
      } catch(err) {
        lastBlockHeight = 0
      }
      let lastState
      try {
        lastState = JSON.parse(await storeDb.get(lastBlockHeight))
        console.log(`State found at ${lastBlockHeight}`)
      } catch(err) {
        console.log(`No state found at ${lastBlockHeight}`)
        lastBlockHeight = 0
        lastState = { appState }
      }
      // let rootHash = await getRoot(lastState.appState)
      let rootHash = createHash('sha256')
        .update(djson.stringify(lastState.appState))
        .digest('hex')
      console.log(rootHash.toString())
      console.log(lastState.appHash)

      // Yes, this is really hacky - but for now its working :D
      if (lastState.appHash == rootHash.toString()) {
        console.log("ALL GOOD")
        lastState = JSON.parse(await storeDb.get(lastBlockHeight))
      } else {
        console.log("NOT GOOD")
        try {
          lastBlockHeight = lastBlockHeight - 1
          lastState = JSON.parse(await storeDb.get(lastBlockHeight))
          console.log(`State found at ${lastBlockHeight}`)
        } catch(err) {
          console.log(`No state found at ${lastBlockHeight}`)
          lastBlockHeight = 0
          lastState = { appState }
        }
        rootHash = createHash('sha256')
          .update(djson.stringify(lastState.appState))
          .digest('hex')
        console.log(rootHash.toString())
        console.log(lastState.appHash)
      }

      rootHash = createHash('sha256')
        .update(djson.stringify(lastState.appState))
        .digest('hex')
      // Object.assign(store, lastState.appState)
      height = lastBlockHeight

      console.log(`Continuing blockchain from:`)
      console.log(`lastBlockHeight: ${lastBlockHeight}`)
      console.log(`lastBlockAppHash: ${rootHash.toString()}`)
      // console.log(JSON.stringify(lastState, null, 2))
      return { LastBlockAppHash: rootHash, LastBlockHeight: lastBlockHeight }
    },
    deliverTx(request) {
      try {
        let tx = decodeTx(request.tx)
        try {
          stateMachine.transition({ type: 'transaction', data: tx })
          return {}
        } catch (e) {
          return { code: 1, log: e.toString() }
        }
      } catch (e) {
        return { code: 1, log: 'Invalid transaction encoding' }
      }
    },
    checkTx(request) {
      try {
        let tx = decodeTx(request.tx)
        try {
          stateMachine.check(tx)
          return {}
        } catch (e) {
          return { code: 1, log: e.toString() }
        }
      } catch (e) {
        return { code: 1, log: 'Invalid transaction encoding' }
      }
    },
    beginBlock(request) {
      let block = request.header
      let time = request.header.time.seconds.toNumber()

      stateMachine.transition({ type: 'begin-block', data: { time, block } })
      return {}
    },
    endBlock() {
      stateMachine.transition({ type: 'block', data: {} })
      let { validators } = stateMachine.info()
      let validatorUpdates = []

      for (let pubKey in validators) {
        validatorUpdates.push({
          pubKey: { type: 'ed25519', data: Buffer.from(pubKey, 'base64') },
          power: { low: validators[pubKey], high: 0 }
        })
      }
      height++
      return {
        validatorUpdates
      }
    },
    async commit() {
      let appHash = stateMachine.commit()
      let appState = stateMachine.query()
      let chainInfo = stateMachine.info()

      let lastBlockHeight
      try {
        lastBlockHeight = await storeDb.get('lastBlockHeight')
      } catch(err) {
        lastBlockHeight = 0
      }
      let lastState
      try {
        lastState = djson.parse(await storeDb.get(lastBlockHeight))
      } catch(err) {
        lastState = { appState }
      }

      let diff = jsondiffpatch.diff(lastState.appState, appState)
      if (diff) {
        console.log(`\nLASTSTATE ${lastBlockHeight}\n`)
        console.log(JSON.stringify(lastState.appState, null, 2))
        console.log(`\nSTATE ${height}\n`)
        console.log(JSON.stringify(appState, null, 2))
        console.log(`\nDIFF ${lastBlockHeight} --> ${height}\n`)
        console.log(JSON.stringify(diff, null, 2))
        let [err, response] = await to(diffDb.put(height, djson.stringify(diff)))
        if (err) console.log("Error saving diff.")
      }

      // Store storeObject in storeDB
      let storeObject = JSON.stringify({
        appHash: appHash.toString('hex'),
        appState,
        chainInfo
      })

      let [err, response] = await to(storeDb.put(height, storeObject))
      if (err) {
        // console.log("Error storing storeObject")
      } else {
        let [err, reponse] = await to(storeDb.put('lastBlockHeight', height))
        if (err) {
          // console.log("Error storing lastBlockHeight")
        } else {
          // console.log("Success storing storeObject and lastBlockHeight")
          if (chainInfo.height > 2) {
            let [err, response] = await to(storeDb.del((height-2)))
            if (err) {
              // console.log("Error deleting storeObject from two heights ago...")
            }
          }
        }
      }

      return { data: Buffer.from(appHash, 'hex') }
    },

    initChain(request) {
      /**
       * in next abci version, we'll get a timestamp here.
       * height is no longer tracked on info (we want to encourage isomorphic chain/channel code)
       */
      let initialInfo = buildInitialInfo(request)
      stateMachine.initialize(initialState, initialInfo)
      return {}
    },
    query(request) {
      let path = request.path

      let queryResponse: object = stateMachine.query(path)
      let value = Buffer.from(djson.stringify(queryResponse)).toString('base64')

      return {
        value,
        height
      }
    }
  })

  return abciServer
}

function buildInitialInfo(initChainRequest) {
  let result = {
    validators: {}
  }
  initChainRequest.validators.forEach(validator => {
    result.validators[
      validator.pubKey.data.toString('base64')
    ] = validator.power.toNumber()
  })

  return result
}

let TxStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) },
  { name: 'nonce', type: vstruct.UInt32BE }
])

function decodeTx(txBuffer) {
  let decoded = TxStruct.decode(txBuffer)
  let tx = djson.parse(decoded.data)
  return tx
}
