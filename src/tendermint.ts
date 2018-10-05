import tendermint = require('tendermint-node')
import fs = require('fs-extra')
import { join } from 'path'
let tomljs = require('toml-js')
let toml = require('toml')

interface PortMap {
  abci: number
  rpc: number
  p2p: number
}

interface TendermintConfig {
  ports: PortMap
  home: string
  logTendermint?: boolean
  genesisPath?: string
  keyPath?: string
  emptyBlocksInterval?: number
  peers?: Array<string>
}

export function genValidator() {
  return tendermint.genValidator()
}

export default async function createTendermintProcess({
  ports,
  home,
  logTendermint,
  genesisPath,
  keyPath,
  emptyBlocksInterval,
  peers
}: TendermintConfig): Promise<any> {
  /**
   * configure server listen addresses for:
   * - rpc (public)
   * - p2p (public)
   * - abci (local)
   */
  let opts: any = {
    rpc: { laddr: 'tcp://0.0.0.0:' + ports.rpc },
    p2p: { laddr: 'tcp://0.0.0.0:' + ports.p2p },
    proxyApp: 'tcp://127.0.0.1:' + ports.abci
  }

  /**
   * initialize tendermint's home directory
   * inside <lotion_home>/networks/<id>
   */
  await tendermint.init(home)

  /**
   * disable authenticated encryption for p2p if
   * no peer strings containing ids are provided.
   */
  if (peers && peers.length > 0) {
    let shouldUseAuth = false
    peers.forEach(peer => {
      if (peer.indexOf('@') !== -1) {
        shouldUseAuth = true
      }
    })

    if (!shouldUseAuth) {
      let cfgPath = join(home, 'config', 'config.toml')
      let configToml = fs.readFileSync(cfgPath, 'utf8')
      configToml = configToml.replace('auth_enc = true', 'auth_enc = false')
      fs.writeFileSync(cfgPath, configToml)

      /**
       * tendermint currently requires a node id even if auth_enc is off.
       * prepend a bogus node id for all peers without an id.
       */
      const bogusId = '0000000000000000000000000000000000000000'
      peers.forEach((peer, index) => {
        if (peer.indexOf('@') === -1) {
          peers[index] = [bogusId, peer].join('@')
        }
      })
    }

    opts.p2p.persistentPeers = peers.join(',')
  }

  /**
   * overwrite the generated genesis.json with
   * the correct one if specified by the developer.
   */
  if (genesisPath) {
    if (!fs.existsSync(genesisPath)) {
      throw new Error(`no genesis file found at ${genesisPath}`)
    }
    fs.copySync(genesisPath, join(home, 'config', 'genesis.json'))
  }

  /**
   * overwrite the priv_validator.json file with the one specified.
   *
   * the file is only copied if the pub_key in the specified file
   * doesn't match the one in the tendermint home directory.
   *
   * information about our validator's last signature is kept in
   * priv_validator.json as a safeguard against accidental double-signing.
   */

   if (emptyBlocksInterval>0) {
     let content = fs.readFileSync(join(home, 'config', 'config.toml'))
     let tmToml = toml.parse(content)
     tmToml.consensus.create_empty_blocks_interval = emptyBlocksInterval
     tmToml.p2p.addr_book_strict = false
     // tmToml.p2p.persistent_peers = peers.join(',')
     // tmToml.p2p.laddr = `tcp://0.0.0.0:${ports.p2p}`
     fs.writeFileSync(
       join(home, 'config', 'config.toml'),
       tomljs.dump(tmToml)
     )
     console.log("Written to config.toml")
   }

  if (keyPath) {
    let privValPath = join(home, 'config', 'priv_validator.json')
    if (!fs.existsSync(keyPath)) {
      throw new Error(`no keys file found at ${keyPath}`)
    }
    let newValidatorJson = fs.readJsonSync(keyPath)
    let oldValidatorJson = fs.readJsonSync(privValPath)

    if (newValidatorJson.pub_key.value !== oldValidatorJson.pub_key.value) {
      fs.copySync(keyPath, privValPath)
    }
  }
  let tendermintProcess = tendermint.node(home, opts)
  if (logTendermint) {
    tendermintProcess.stdout.pipe(process.stdout)
    tendermintProcess.stderr.pipe(process.stderr)
  }

  tendermintProcess.then(() => {
    console.log('tm exited')
  })
  await tendermintProcess.synced()
  return {}
}
