// function to start full nodes announcing themselves for light clients or peers
let { createServer } = require('peer-channel')

function announceFullNodeGCI({ GCI, tendermintPort }) {
  let server = createServer(function(socket) {
    socket.send('' + tendermintPort)
    socket.end()

    socket.on('error', e => {})
  })

  server.listen('fullnode:' + GCI)
}

module.exports = announceFullNodeGCI
