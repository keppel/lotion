let fs = require('fs')
let { stringify } = require('deterministic-json')
let { join } = require('path')
let tendermint = require('tendermint-node')

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
  initialAppHash,
  createEmptyBlocks,
  unsafeRpc
}) {
  return new Promise(async (resolveNodeRunning, rejectNodeRunning) => {
    await tendermint.init(lotionPath)

    if (genesis) {
      fs.writeFileSync(join(lotionPath, 'config/genesis.json'), stringify(genesis))
    }
    if (keys) {
      let validatorJsonPath = join(lotionPath, 'config/priv_validator.json')
      let generatedValidatorJson = JSON.parse(
        fs.readFileSync(validatorJsonPath, { encoding: 'utf8' })
      )
      let newValidatorJson = Object.assign({}, generatedValidatorJson, keys)
      fs.writeFileSync(validatorJsonPath, JSON.stringify(newValidatorJson))
    }

    // add app hash to genesis
    let newGenesis = Object.assign(
      {},
      JSON.parse(fs.readFileSync(join(lotionPath, 'config/genesis.json'))),
      {
        app_hash: initialAppHash
      }
    )
    fs.writeFileSync(join(lotionPath, 'config/genesis.json'), stringify(newGenesis))

    let opts = {
      rpc: { laddr: 'tcp://0.0.0.0:' + tendermintPort },
      p2p: { laddr: 'tcp://0.0.0.0:' + p2pPort },
      proxyApp: 'tcp://127.0.0.1:' + abciPort
    }
    if (peers.length) {
      opts.seeds = peers.join(',')
    }
    if (unsafeRpc) {
      opts.rpc.unsafe = true
    }
    if (createEmptyBlocks === false) {
      opts.consensus = { createEmptyBlocks: false }
    }

    let shuttingDown = false
    let tendermintProcess = tendermint.node(lotionPath, opts)
    if (logTendermint) {
      tendermintProcess.stdout.pipe(process.stdout)
      tendermintProcess.stderr.pipe(process.stderr)
    }
    tendermintProcess.then(() => {
      if (shuttingDown) return
      throw new Error('Tendermint node crashed')
    })
    let synced = new Promise((resolveSynced, rejectSynced) => {
      let nodeRunningResolved = false
      const POLL_INTERVAL = 1000

      let interval = setInterval(async () => {
        let tmStatus = await tendermintProcess.rpc.status()
          .then(res => res.result)
          .catch(e => {})
        if (tmStatus && Number(tmStatus.sync_info.latest_block_height)) {
          if (!nodeRunningResolved) {
            nodeRunningResolved = true
            resolveNodeRunning({
              synced,
              process: tendermintProcess,
              close: () => {
                shuttingDown = true
                tendermintProcess.kill()
              }
            })
          }

          if (!tmStatus.sync_info.syncing) {
            resolveSynced()
            clearInterval(interval)
          }
        }
      }, POLL_INTERVAL)
    })
  })
}
