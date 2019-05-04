import djson = require('deterministic-json')
import vstruct = require('varstruct')

let { createHash } = require('crypto')
let fs = require('fs-extra')
let { join } = require('path')
let createServer = require('abci')
let merk = require('merk')

export interface ABCIServer {
  listen(port)
}

export default function createABCIServer(
  state,
  stateMachine,
  initialState,
  lotionAppHome
): any {
  let stateFilePath = join(lotionAppHome, 'prev-state.json')

  let height = 0
  let abciServer = createServer({
    async info(request) {
      let stateExists = await fs.pathExists(stateFilePath)
      if (stateExists) {
        let stateFile
        try {
          let stateFileJSON = await fs.readFile(stateFilePath, 'utf8')
          stateFile = JSON.parse(stateFileJSON)
        } catch (err) {
          // TODO: warning log
          // error reading file, replay chain
          return {}
        }

        let rootHash = merk.hash(state)
        if (stateFile.rootHash !== rootHash) {
          // merk db and JSON file don't match, let's replay the chain
          // TODO: warning log since we probably want to know this is happening
          return {}
        }

        stateMachine.initialize(null, {}, true)
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
      // ensure we don't have any changes since last commit
      merk.rollback(state)

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
      stateMachine.commit()
      height++

      let newStateFilePath = join(lotionAppHome, `state.json`)
      if (await fs.pathExists(newStateFilePath)) {
        await fs.move(newStateFilePath, stateFilePath, { overwrite: true })
      }

      // it's ok if merk commit and state file don't update atomically,
      // we will just fall back to replaying the chain next time we load
      await merk.commit(state)
      let rootHash = null
      try {
        // TODO: make this return null in merk instead of throwing
        rootHash = merk.hash(state)
      } catch (err) {
        // handle empty merk store, hash stays null
      }

      await fs.writeFile(
        newStateFilePath,
        JSON.stringify({
          height: height,
          rootHash: rootHash
        })
      )

      return { data: rootHash ? Buffer.from(rootHash, 'hex') : Buffer.alloc(0) }
    },
    async initChain(request) {
      /**
       * in next abci version, we'll get a timestamp here.
       * height is no longer tracked on info (we want to encourage isomorphic chain/channel code)
       */
      let initialInfo = buildInitialInfo(request)
      stateMachine.initialize(initialState, initialInfo)
      await merk.commit(state)
      return {}
    },
    async query(request) {
      // assert merk tree is not empty
      // TODO: change merk so we don't have to do this
      try {
        merk.hash(state)
      } catch (err) {
        return { value: Buffer.from('null'), height }
      }

      let path = request.path
      let proof = null
      let proofHeight = height
      proof = await merk.proof(state, path)
      let proofJSON = JSON.stringify(proof)
      let proofBytes = Buffer.from(proofJSON)
      return {
        value: proofBytes,
        height: proofHeight
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
