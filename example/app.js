let lotion = require('../dist/index')

console.log(`Keys: ${process.argv[2]}`)
console.log(`Genesis: ${process.argv[3]}`)
console.log(`Peer: ${process.argv[4]}`)
console.log(`RPC: ${process.argv[5]}`)
console.log(`P2P: ${process.argv[6]}`)
console.log(`Lotion: ${process.argv[7]}`)

let app = lotion({
  keyPath: process.argv[2],
  genesisPath: process.argv[3],
  peers: [process.argv[4]],
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
