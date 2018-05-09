let initialState = { count: 0, blockCount: 0, foo: { bar: { beep: 'boop' } }, height: 0, txHeight: 0, lastMatch: 0  }
let axios = require('axios')

let port = 3001
let opts = {
  initialState,
  genesis: 'genesis.json',
  keys: 'keys2.json',
  logTendermint: true,
  peers: ['localhost:46661'],
  tendermintPort: 46658,
  p2pPort: 46660,
  devMode: true,
  createEmptyBlocks: true,
  createEmptyBlocksInterval: 5,
}
let app = require('../../')(opts)

app.use((state, tx) => {
  // validate tx, mutate state if it's valid.
  state.txHeight++
  state.count++
  console.log(`State count: ${state.count}`)
})

app.useBlock(async(state, chainInfo) => {
  let response = await axios.get(`http://localhost:${opts.tendermintPort}/blockchain?minHeight=${chainInfo.height-1}&maxHeight=${chainInfo.height-1}`);
  let blockHeader = response.data.result.block_metas[0].header;
  // console.log(blockHeader)
  let time = Date.parse(blockHeader.time)
  // let time = parseInt(Date.now()/10000)
  console.log("Checking time: " + time)
  if (time > (state.lastMatch + 15000)) {
    console.log("\nMATCHING TIME! " + time + "\n")
    state.lastMatch = time
  }
})

app.listen(port).then(({ GCI }) => {
  console.log(GCI)
})
