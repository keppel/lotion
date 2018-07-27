let fs = require('fs')
let { stringify } = require('deterministic-json')
let { join } = require('path')
let tendermint = require('tendermint-node')
let tomljs = require('toml-js')
let toml = require('toml')

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
  initialAppHash,
  createEmptyBlocks,
  createEmptyBlocksInterval,
  unsafeRpc
}) {
  await tendermint.init(lotionPath)

  if (genesis) {
    fs.writeFileSync(
      join(lotionPath, 'config', 'genesis.json'),
      stringify(genesis)
    )
  }
  if (keys) {
    let validatorJsonPath = join(lotionPath, 'config', 'priv_validator.json')
    let generatedValidatorJson = JSON.parse(
      fs.readFileSync(validatorJsonPath, { encoding: 'utf8' })
    )
    let newValidatorJson = Object.assign({}, generatedValidatorJson, keys)
    fs.writeFileSync(validatorJsonPath, JSON.stringify(newValidatorJson))
  }

  // add app hash to genesis
  let newGenesis = Object.assign(
    {},
    JSON.parse(fs.readFileSync(join(lotionPath, 'config', 'genesis.json'))),
    {
      app_hash: initialAppHash
    }
  )
  fs.writeFileSync(
    join(lotionPath, 'config', 'genesis.json'),
    stringify(newGenesis)
  )

  let opts = {
    rpc: { laddr: 'tcp://0.0.0.0:' + tendermintPort },
    p2p: { laddr: 'tcp://0.0.0.0:' + p2pPort },
    proxyApp: 'tcp://127.0.0.1:' + abciPort
  }
  if (peers.length) {
    // opts.p2p.seeds = peers.join(',')
    opts.p2p.persistentPeers = peers.join(',')
  }
  if (unsafeRpc) {
    opts.rpc.unsafe = true
  }
  if (createEmptyBlocks === false) {
    opts.consensus = { CreateEmptyBlocks: false }
  }
  if (createEmptyBlocksInterval>0) {
    let content = fs.readFileSync(join(lotionPath, 'config', 'config.toml'))
    let tmToml = toml.parse(content)
    tmToml.consensus.create_empty_blocks_interval = createEmptyBlocksInterval
    fs.writeFileSync(
      join(lotionPath, 'config', 'config.toml'),
      tomljs.dump(tmToml)
    )
    console.log("Written to config.toml")
  }
  if (!logTendermint) {
    opts.logLevel = 'error'
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
  }).catch((error)=>{
    console.log(error)
    console.log("exiting...")
    process.exit(22)
  })

  // wait for RPC server
  await tendermintProcess.started()
  return {
    synced: tendermintProcess.synced(),
    process: tendermintProcess,
    close: () => {
      shuttingDown = true
      tendermintProcess.kill()
    }
  }
}
