let initialState = { count: 0 }

let port = 3000
let app = require('../../')({
  initialState,
  devMode: true
})

app.use((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count++
})

app.listen(port)
