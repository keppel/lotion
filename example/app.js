let lotion = require('../dist/index')

let app = lotion({
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
  console.log(chainInfo)
})

app.start().then(console.log)
