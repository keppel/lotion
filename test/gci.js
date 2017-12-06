let test = require('tape-promise/tape')
let lotion = require('../index.js')
let axios = require('axios')
let getGenesisGCI = require('../lib/gci-get-genesis.js')
let getGenesisRPC = require('../lib/get-genesis-rpc.js')
let IPFSNode = require('../lib/ipfs-node.js')
let os = require('os')

const LOTION_HOME = process.env.LOTION_HOME || os.homedir() + '/.lotion'

let app = lotion({ initialState: { count: 0 } })
let gci
let appInfo
let ipfsNode

app.use(state => state.count++)

test('setup', async t => {
  appInfo = await app.listen(3000)
  gci = appInfo.GCI
  t.equal(typeof gci, 'string')

  ipfsNode = await IPFSNode({
    lotionPath: LOTION_HOME + '/ipfs/' + Math.floor(Math.random() * 1e12)
  })
})

let rpcGenesis
let ipfsGenesis
test('fetch genesis from RPC and GCI and compare', async t => {
  rpcGenesis = await getGenesisRPC('http://localhost:3000/tendermint')
  ipfsGenesis = await getGenesisGCI(gci, ipfsNode)
  t.equal(rpcGenesis, ipfsGenesis)
})

test('cleanup', t => {
  t.end()
  process.exit()
})
