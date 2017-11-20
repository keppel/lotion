let initialState = { count: 0 }

let port = 3002
let app = require('../../')({
  initialState,
  genesis: 'genesis.json',
  keys: 'keys.json',
  logTendermint: true,
  target: 'localhost:46657',
  p2pPort: 46662,
  lite: true,
  devMode: true
})

app.use((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count++
})

app.listen(port)
