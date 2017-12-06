// function that fetches genesis.json via ipfs from the GCI
let discoveryChannel = require('discovery-channel')
let getPort = require('get-port')
let net = require('net')
let getGCIFromGenesis = require('./get-gci-from-genesis.js')

module.exports = function fetchGenesis(GCI) {
  return new Promise(async (resolve, reject) => {
    let dc = discoveryChannel()
    dc.on('peer', (id, peer) => {
      let socket = net.connect(peer.port, peer.host)
      let data = ''
      socket.on('data', function(chunk) {
        data += chunk.toString()
      })
      socket.on('end', function() {
        // validate the data this peer told us about
        if (getGCIFromGenesis(data) === GCI) {
          resolve(data)
        }
      })
      socket.on('error', e => {
        socket.destroy()
      })
    })

    dc.join(GCI)
  })
}
