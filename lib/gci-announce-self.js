// function to start full nodes announcing themselves for light clients or peers
let discoveryServer = require('discovery-server')

function announceFullNodeGCI({ GCI, tendermintPort }) {
  let server = discoveryServer(function(socket) {
    let tmPortBytes = Buffer(2)
    tmPortBytes.writeUInt16BE(tendermintPort)
    socket.write(tmPortBytes)
    socket.end()
  })

  server.listen('fullnode:' + GCI, function() {})
}

module.exports = announceFullNodeGCI
