let initialState = { count: 0 }

let port = 3001
let app = require('../../')({
  initialState,
  genesis: 'genesis.json',
  keys: 'keys2.json',
  peers: ['localhost:46661'],
  p2pPort: 46660,
  devMode: true
})

app.use((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count++
})

app.listen(port)
