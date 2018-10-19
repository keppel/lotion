let connect = require('lotion-connect')

let genesis = JSON.parse(require('fs').readFileSync('genesis.json', { encoding: 'utf8' }))
let client
let nodes = ['ws://127.0.0.1:46657']

const main = async function() {
  console.log(`Connecting to one of nodes: ${nodes}`)
  client = await connect(null, {genesis, nodes})
  console.log(`Connected.`)
  let state = await client.getState()
  console.log("State:")
  console.log(JSON.stringify(state, null, 2))
}

main()
