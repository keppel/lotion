import Lotion from '../src/index'

let app = Lotion({
  initialState: { count: 0, blockCount: 0 },
  // logTendermint: true,
  rpcPort: 25555
})

app.use(function(state, tx) {
  state.count++
  if (tx.shouldError) {
    throw new Error('this tx was supposed to error')
  }
})

app.useBlock(function(state, info) {
  state.blockCount++
  let key = Object.keys(info.validators)[0]
  info.validators[key]++
})

async function main() {
  console.log(await app.start())
}

main()

process.on('unhandledRejection', e => {
  console.log(e)
})
