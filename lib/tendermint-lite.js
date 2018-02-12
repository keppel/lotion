let axios = require('axios')
let { join } = require('path')
let { stringify } = require('./json.js')
let execa = require('execa')
let fs = require('fs-extra')

let tendermintBin = require.resolve('../bin/tendermint')

module.exports = function({
  lotionPath,
  tendermintPort,
  abciPort,
  p2pPort,
  networkId,
  logTendermint,
  peers,
  genesis,
  keys,
  target,
  initialAppHash
}) {
  return new Promise(async (resolveNodeRunning, rejectNodeRunning) => {
    Object.assign(genesis, { app_hash: initialAppHash })
    if (typeof target !== 'string') {
      throw new Error('must specify a target in lite client mode')
    }
    if (!genesis) {
      throw new Error('must specify a genesis file in lite client mode')
    }
    // await initNode(lotionPath, genesis, target, logTendermint)
    // add app hash to genesis
    await fs.writeFile(join(lotionPath, 'genesis.json'), stringify(genesis))

    let shuttingDown = false
    let proxyProcess = execa(
      tendermintBin,
      [
        'lite',
        '--laddr',
        ':' + tendermintPort,
        '--home',
        lotionPath,
        '--node',
        target,
        '--chain-id',
        genesis.chain_id
      ],
      {
        stdout: logTendermint ? 'pipe' : 'ignore'
      }
    )
    proxyProcess.on('close', () => {
      if (shuttingDown) return
      throw new Error('Tendermint node crashed')
    })
    let synced = new Promise((resolveSynced, rejectSynced) => {
      const SYNC_POLL_INTERVAL = 1000

      let interval = setInterval(async () => {
        let tmStatus = await axios
          .get(`http://localhost:${tendermintPort}/status`)
          .then(res => res.data.result)
          .catch(e => {})
        if (tmStatus && Number(tmStatus.latest_block_height)) {
          nodeRunningResolved = true
          resolveNodeRunning({
            synced,
            process: proxyProcess,
            close: () => {
              proxyProcess.kill()
            }
          })
        }

        if (!tmStatus.syncing) {
          resolveSynced()
          clearInterval(interval)
        }
      }, SYNC_POLL_INTERVAL)
    })
  })
}
