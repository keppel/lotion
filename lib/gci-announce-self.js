// function to start full nodes announcing themselves for light clients or peers
let peernet = require('peer-network')
let network = peernet()

function announceFullNodeGCI({ GCI, tendermintPort }) {
  console.log('announcing self as full node')
  let server = network.createServer()
  server.on('connection', () => {
    // tell peer my tendermint rpc port
    console.log('got connection from someone who wants to peer with us')
  })

  server.listen('fullnode:' + GCI)
}
