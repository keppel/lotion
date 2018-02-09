let initialState = { count: 0, blockCount: 0, foo: { bar: { beep: 'boop' } } }

let port = 3000
let app = require('../../')({
  initialState,
  genesis: 'genesis.json',
  keys: 'keys.json',
  logTendermint: true,
  peers: ['localhost:46660'],
  tendermintPort: 46657,
  p2pPort: 46661,
  devMode: true
})

app.use((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count++
})

app.useBlock(state => {
  state.blockCount++
})

app.listen(port).then(({ GCI }) => {
  console.log(GCI)
})
