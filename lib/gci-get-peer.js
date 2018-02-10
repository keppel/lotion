// function that discovers full nodes running chain for a given GCI
let discoveryChannel = require('discovery-channel')
let defaults = require('dat-swarm-defaults')()
let net = require('net')

function getOnePeer(GCI) {
  return new Promise((resolve, reject) => {
    let dc = discoveryChannel(defaults)

    dc.on('peer', function(key, peer) {
      let socket = net.connect(peer.port, peer.host)
      socket.on('data', async data => {
        // full node writing to tell me what port to use for their tendermint rpc server
        if (data.length === 2) {
          let port = data.readUInt16BE()
          let rpcUrl = 'ws://' + peer.host + ':' + port
          socket.destroy()
          resolve(rpcUrl)
        }
      })

      socket.on('error', e => {
        socket.destroy()
      })
    })

    dc.join('fullnode:' + GCI)
  })
}

module.exports = getOnePeer
