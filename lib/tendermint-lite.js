let { join } = require('path')
let { stringify } = require('deterministic-json')
let fs = require('fs-extra')
let tendermint = require('tendermint-node')

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
  // await initNode(lotionPath, genesis, target, logTendermint)
  // add app hash to genesis
  await fs.writeFile(join(lotionPath, 'genesis.json'), stringify(genesis))

  let shuttingDown = false
  let proxyProcess = tendermint.lite(target, lotionPath, {
    laddr: ':' + tendermintPort,
    'chain-id': genesis.chain_id
  })
  proxyProcess.then(() => {
    if (shuttingDown) return
    throw new Error('Tendermint node crashed')
  })

  // wait for RPC server
  await proxyProcess.started()

  return {
    synced: proxyProcess.synced(),
    process: proxyProcess,
    close: () => {
      proxyProcess.kill()
    }
  }
}
