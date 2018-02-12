let { stringify } = require('./json.js')
let { join } = require('path')
let axios = require('axios')
let fs = require('fs')
let execa = require('execa')

const tmBin = require.resolve('../bin/tendermint')

function initNode(lotionPath) {
  return new Promise((resolve, reject) => {
    let tmInitProcess = execa(tmBin, ['init', '--home', lotionPath])
    tmInitProcess.on('close', resolve)
  })
}

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
    try {
      await initNode(lotionPath)
    } catch (e) {
      console.log('error initializing tendermint node:')
      console.log(e)
    }
    if (genesis) {
      fs.writeFileSync(join(lotionPath, 'genesis.json'), stringify(genesis))
    }
    if (keys) {
      let validatorJsonPath = join(lotionPath, 'priv_validator.json')
      let generatedValidatorJson = JSON.parse(
        fs.readFileSync(validatorJsonPath, { encoding: 'utf8' })
      )
      let newValidatorJson = Object.assign({}, generatedValidatorJson, keys)
      fs.writeFileSync(validatorJsonPath, JSON.stringify(newValidatorJson))
    }

    // add app hash to genesis
    let newGenesis = Object.assign(
      {},
      JSON.parse(fs.readFileSync(join(lotionPath, 'genesis.json'))),
      {
        app_hash: initialAppHash
      }
    )
    fs.writeFileSync(join(lotionPath, 'genesis.json'), stringify(newGenesis))

    let tpArgs = [
      'node',
      '--rpc.laddr',
      'tcp://0.0.0.0:' + tendermintPort,
      '--proxy_app',
      'tcp://127.0.0.1:' + abciPort,
      '--home',
      lotionPath,
      '--p2p.laddr',
      'tcp://0.0.0.0:' + p2pPort
    ]
    if (peers.length) {
      tpArgs.push('--p2p.seeds')
      tpArgs.push(peers.join(','))
    } else if (unsafeRpc) {
      tpArgs.push('--rpc.unsafe')
    }
    if (createEmptyBlocks === false) {
      tpArgs.push('--consensus.create_empty_blocks=false')
    }

    let shuttingDown = false
    let tendermintProcess = execa(tmBin, tpArgs, {
      stdout: logTendermint ? 'pipe' : 'ignore'
    })
    if (logTendermint) {
      tendermintProcess.stdout.pipe(process.stdout)
      tendermintProcess.stderr.pipe(process.stderr)
    }
    tendermintProcess.on('close', () => {
      if (shuttingDown) return
      throw new Error('Tendermint node crashed')
    })
    let synced = new Promise((resolveSynced, rejectSynced) => {
      let nodeRunningResolved = false
      const POLL_INTERVAL = 1000

      let interval = setInterval(async () => {
        let tmStatus = await axios
          .get(`http://localhost:${tendermintPort}/status`)
          .then(res => res.data.result)
          .catch(e => {})
        if (tmStatus && Number(tmStatus.latest_block_height)) {
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

          if (!tmStatus.syncing) {
            resolveSynced()
            clearInterval(interval)
          }
        }
      }, POLL_INTERVAL)
    })
  })
}
