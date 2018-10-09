let lotion = require('../dist/index')

console.log(`Keys: ${process.argv[2]}`)
console.log(`Genesis: ${process.argv[3]}`)
console.log(`RPC: ${process.argv[4]}`)
console.log(`P2P: ${process.argv[5]}`)
console.log(`Lotion: ${process.argv[6]}`)

let app = lotion({
  keyPath: process.argv[2],
  genesisPath: process.argv[3],
  peers: ['192.168.1.100:46660', '192.168.1.101:46660', '192.168.1.102:46660'],
  rpcPort: process.argv[5],
  p2pPort: process.argv[6],
  lotionPort: process.argv[7],
  logTendermint: false,
  emptyBlocksInterval: 12,
  devMode: false,
  initialState: {
    count: 0
  }
})

app.use(function(state, tx) {
  if (state.count === tx.nonce) {
    state.count++
  }
})



app.useBlock(function(state, chainInfo) {
  console.log(`Blocktime: ${chainInfo.time}`)
})

app.start().then(console.log)
