let initialState = { count: 0 }

let port = 3001
let lotion = require('../../')({
  initialState,
  port
})

let app = lotion((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count++
}).then(genesisKey => {
  console.log(`server listening on port ${port}`)
  console.log(`genesis: ${genesisKey}`)
})
