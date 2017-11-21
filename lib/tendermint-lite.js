let { spawn } = require('child_process')
let axios = require('axios')
let basecliBin = __dirname + '/../bin/basecli'
let { stringify } = require('./json.js')
let fs = require('fs')

function initNode(lotionPath, genesis, node) {
  return new Promise((resolve, reject) => {
    let initProcess = spawn(basecliBin, [
      'init',
      '--force-reset',
      '--chain-id',
      genesis.chain_id,
      '--node',
      node,
      '--home',
      lotionPath
    ])

    initProcess.stdout.pipe(process.stdout)
    initProcess.stderr.pipe(process.stderr)
    initProcess.stdin.write('y\n')
    initProcess.on('close', resolve)
  })
}

module.exports = async function({
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
  Object.assign(genesis, { app_hash: initialAppHash })
  if (typeof target !== 'string') {
    throw new Error('must specify a target in lite client mode')
  }
  if (!genesis) {
    throw new Error('must specify a genesis file in lite client mode')
  }
  await initNode(lotionPath, genesis, target)
  // add app hash to genesis
  fs.writeFileSync(lotionPath + '/genesis.json', stringify(genesis))

  let shuttingDown = false
  let proxyProcess = spawn(basecliBin, [
    'proxy',
    '--serve',
    'tcp://localhost:' + tendermintPort,
    '--home',
    lotionPath
  ])
  if (logTendermint) {
    proxyProcess.stdout.pipe(process.stdout)
    proxyProcess.stderr.pipe(process.stderr)
  }
  proxyProcess.on('close', () => {
    if (shuttingDown) return
    throw new Error('Tendermint node crashed')
  })

  let waitForSync = new Promise((resolve, reject) => {
    const SYNC_POLL_INTERVAL = 1000

    let interval = setInterval(async () => {
      let tmStatus = await axios
        .get(`http://localhost:${tendermintPort}/status`)
        .then(res => res.data.result)
        .catch(e => {})
      if (tmStatus && tmStatus.syncing === false) {
        resolve()
        clearInterval(interval)
      }
    }, SYNC_POLL_INTERVAL)
  })

  await waitForSync
}
