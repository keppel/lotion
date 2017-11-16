let { spawn } = require('child_process')
const tmBin = __dirname + '/../bin/tendermint'
let axios = require('axios')
let fs = require('fs')
let discoverPeers = require('./peer-discovery.js')

function initNode(lotionPath) {
  return new Promise((resolve, reject) => {
    let tmInitProcess = spawn(tmBin, ['init', '--home', lotionPath])
    tmInitProcess.on('close', resolve)
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
  genesis
}) {
  await initNode(lotionPath)
  if (genesis) {
    fs.writeFileSync(lotionPath + '/genesis.json', genesis)
  }
  let tpArgs = [
    'node',
    '--rpc.laddr',
    'tcp://127.0.0.1:' + tendermintPort,
    '--rpc.unsafe',
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
  }

  let shuttingDown = false
  let tendermintProcess = spawn(tmBin, tpArgs)
  if (logTendermint) {
    tendermintProcess.stdout.pipe(process.stdout)
    tendermintProcess.stderr.pipe(process.stderr)
  }
  tendermintProcess.on('close', () => {
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
  
  if (!peers || peers.length === 0) {
    discoverPeers({ networkId, tendermintPort, p2pPort })
  }

  return {
    process: tendermintProcess,
    close: () => {
      shuttingDown = true
      tendermintProcess.kill()
    }
  }
}
