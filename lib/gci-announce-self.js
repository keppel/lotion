// function to start full nodes announcing themselves for light clients or peers
let discoveryServer = require('discovery-server')
let defaults = require('dat-swarm-defaults')({ utp: false })

function announceFullNodeGCI({ GCI, tendermintPort }) {
  let server = discoveryServer(defaults, function(socket) {
    let tmPortBytes = Buffer(2)
    tmPortBytes.writeUInt16BE(tendermintPort)
    socket.write(tmPortBytes)
    socket.end()

    socket.on('error', e => {})
  })

  server.listen('fullnode:' + GCI, function() {})
}

module.exports = announceFullNodeGCI
