let lotion = require('../dist/index')


let keyPath = process.argv[2]
let genesisPath = process.argv[3]
let rpcPort = process.argv[4]
let p2pPort = process.argv[5]
let lotionPort = process.argv[6]
let peers = JSON.parse(process.argv[7] || "[]")

console.log(`Keys: ${keyPath}`)
console.log(`Genesis: ${genesisPath}`)
console.log(`RPC: ${rpcPort}`)
console.log(`P2P: ${p2pPort}`)
console.log(`Lotion: ${lotionPort}`)
console.log(`Peers: ${peers}`)

let app = lotion({
  keyPath,
  genesisPath,
  peers,
  rpcPort,
  p2pPort,
  lotionPort,
  logTendermint: false,
  emptyBlocksInterval: 12,
  devMode: false,
  initialState: {
    registry: {
      count: 0,
      accounts: {},
      posts: {}
    }
  }
})

app.use(function(state, tx) {
  if (tx.sender) {
    if (!state.registry.accounts[sender]) {
      state.registry.accounts[sender] = {
        nonce: 0
      }
    }
    if (state.registry.accounts[sender].nonce === tx.nonce) {
      state.registry.accounts[sender].nonce++
    }
  }
})



app.useBlock(function(state, chainInfo) {
  console.log(`Blocktime: ${chainInfo.time}`)
  console.log(`Height: ${chainInfo.height}`)
})

app.start().then(console.log)
