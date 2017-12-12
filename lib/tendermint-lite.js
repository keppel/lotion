let axios = require('axios')
let basecliBin = __dirname + '/../bin/basecli'
let { stringify } = require('./json.js')
let execa = require('execa')
let fs = require('fs')

function initNode(lotionPath, genesis, node, logTendermint) {
  return new Promise((resolve, reject) => {
    let initProcess = execa(basecliBin, [
      'init',
      '--chain-id',
      genesis.chain_id,
      '--node',
      node,
      '--home',
      lotionPath
    ])

    if (logTendermint) {
      initProcess.stdout.pipe(process.stdout)
      initProcess.stderr.pipe(process.stderr)
    }
    initProcess.stdin.write('y\n')
    initProcess.on('close', resolve)
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
  target,
  initialAppHash
}) {
  return new Promise(async (resolveNodeRunning, rejectNodeRunning) => {
    let nodeRunningResolved = false
    Object.assign(genesis, { app_hash: initialAppHash })
    if (typeof target !== 'string') {
      throw new Error('must specify a target in lite client mode')
    }
    if (!genesis) {
      throw new Error('must specify a genesis file in lite client mode')
    }
    await initNode(lotionPath, genesis, target, logTendermint)
    // add app hash to genesis
    fs.writeFileSync(lotionPath + '/genesis.json', stringify(genesis))

    let shuttingDown = false
    let proxyProcess = execa(
      basecliBin,
      [
        'proxy',
        '--serve',
        'tcp://localhost:' + tendermintPort,
        '--home',
        lotionPath
      ],
      {
        stdout: logTendermint ? 'pipe' : 'ignore'
      }
    )
    if (logTendermint) {
      proxyProcess.stdout.pipe(process.stdout)
      proxyProcess.stderr.pipe(process.stderr)
    }
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
