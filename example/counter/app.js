let initialState = { count: 0 }

let port = 3000
let app = require('../../')({
  initialState,
  genesis: 'genesis.json',
  keys: 'keys.json',
  logTendermint: true,
  peers: ['localhost:46660'],
  p2pPort: 46661,
  devMode: true
})

app.use((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count++
})

app.listen(port)
