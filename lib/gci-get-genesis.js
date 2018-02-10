// function that fetches genesis.json via ipfs from the GCI
let discoveryChannel = require('discovery-channel')
let net = require('net')
let defaults = require('dat-swarm-defaults')()
let getGCIFromGenesis = require('./get-gci-from-genesis.js')

module.exports = function fetchGenesis(GCI) {
  return new Promise(async (resolve, reject) => {
    let dc = discoveryChannel(defaults)
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
