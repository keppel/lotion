// function that discovers full nodes running chain for a given GCI
let axios = require('axios')
let discoveryChannel = require('discovery-channel')
let net = require('net')

function getOnePeer(GCI) {
  return new Promise((resolve, reject) => {
    let dc = discoveryChannel()

    dc.on('peer', function(key, peer) {
      console.log('got a discovery channel peer')
      let socket = net.connect(peer.port, peer.host)
      socket.on('data', data => {
        // full node writing to tell me what port to use for their tendermint rpc server
        if (data.length === 2) {
          let port = data.readUInt16BE()
          console.log(peer.host + ':' + port)
          socket.destroy()
        }
      })

      socket.on('error', e => {
        console.log('socket error')
        console.log(e)
      })
    })

    dc.join('fullnode:' + GCI)
  })
}

module.exports = getOnePeer

if (!module.parent) {
  async function main() {
    console.log(
      await getOnePeer('QmZSLi6CBzazQyCyY2Hw6degALjDZE78d5fBowi71dDXRU')
    )
  }
  main()
}
