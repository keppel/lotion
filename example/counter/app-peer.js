let initialState = { count: 0 }

let port = 3002
let lotion = require('../../')({
  initialState,
  port,
  logTendermint: true,
  genesisKey: '922b61f2384343147715e9e8d4131ca56772f844ab5aa487b50ebce533cc70f4',
  path: __dirname + '/lotion-peer-data'
})

let app = lotion((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.count += tx.value
}).then(genesisKey => {
  console.log(`server listening on port ${port}`)
  console.log(`genesis: ${genesisKey}`)
})
