import djson = require('deterministic-json')
import vstruct = require('varstruct')

let createServer = require('abci')
let { createHash } = require('crypto')
let fs = require('fs-extra')
let { join } = require('path')

export interface ABCIServer {
  listen(port)
}

export default function createABCIServer(
  stateMachine,
  initialState,
  lotionAppHome
): any {
  let stateFilePath = join(lotionAppHome, 'prev-state.json')
  let height = 0
  let abciServer = createServer({
    async info(request) {
      let stateFileExists = await fs.pathExists(stateFilePath)
      if (stateFileExists) {
        let stateFile = djson.parse(await fs.readFile(stateFilePath, 'utf8'))
        let rootHash = createHash('sha256')
          .update(djson.stringify(stateFile.state))
          .digest()

        stateMachine.initialize(stateFile.state, stateFile.context, true)
        height = stateFile.height
        return {
          lastBlockAppHash: rootHash,
          lastBlockHeight: stateFile.height
        }
      } else {
        return {}
      }
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
      let time = request.header.time.seconds.toNumber()
      stateMachine.transition({ type: 'begin-block', data: { time } })
      return {}
    },
    endBlock() {
      stateMachine.transition({ type: 'block', data: {} })
      let { validators } = stateMachine.context()
      let validatorUpdates = []

      for (let pubKey in validators) {
        validatorUpdates.push({
          pubKey: { type: 'ed25519', data: Buffer.from(pubKey, 'base64') },
          power: { low: validators[pubKey], high: 0 }
        })
      }
      return {
        validatorUpdates
      }
    },
    async commit() {
      let data = stateMachine.commit()
      height++
      let newStateFilePath = join(lotionAppHome, `state.json`)
      if (await fs.pathExists(newStateFilePath)) {
        await fs.move(newStateFilePath, stateFilePath, { overwrite: true })
      }

      let context = Object.assign({}, stateMachine.context())
      delete context.rootState
      await fs.writeFile(
        newStateFilePath,
        djson.stringify({
          context,
          state: stateMachine.query(),
          height: height
        })
      )
      return { data: Buffer.from(data, 'hex') }
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
