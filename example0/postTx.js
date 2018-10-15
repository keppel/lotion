const axios = require('axios')
let connect = require('lotion-connect')
let { randomBytes } = require('crypto')


let genesis = JSON.parse(require('fs').readFileSync('genesis.json', { encoding: 'utf8' }))
let client
let nodes = ['ws://127.0.0.1:46657']
let period = Math.round(5000*Math.random() + 10000)
console.log(`Period: ${period}`)

let address = randomBytes(16).toString('hex')

const main = async function() {
  console.log(`Connecting to one of nodes: ${nodes}`)
  client = await connect(null, {genesis, nodes})
  console.log(`Connected.`)
  let state = await client.getState()
  console.log("State:")
  console.log(JSON.stringify(state, null, 2))

  let nonce = (state.registry.accounts[address]) ? state.registry.accounts[address].nonce : 0

  let tx = {
    sender: address,
    nonce
  }

  console.log("Tx:")
  console.log(JSON.stringify(tx, null, 2))
  let result = await client.send(tx)
  console.log(result)
}

// setInterval(function () {
//   main()
// }, period);


main()
