// function that discovers full nodes running chain for a given GCI
let axios = require('axios')
let discoveryChannel = require('discovery-channel')
let net = require('net')

function getOnePeer(GCI) {
  return new Promise((resolve, reject) => {
    let dc = discoveryChannel()

    dc.on('peer', function(key, peer) {
      let socket = net.connect(peer.port, peer.host)
      socket.on('data', async data => {
        // full node writing to tell me what port to use for their tendermint rpc server
        if (data.length === 2) {
          let port = data.readUInt16BE()
          let rpcUrl = peer.host + ':' + port
          socket.destroy()
          // do a sanity check on the reported full node before resolving
          let nodeIsLegit = await axios
            .get('http://' + rpcUrl + '/status')
            .then(res => {
              let tenSecondsAgo = (Date.now() - 10000) * 1e6
              if (
                res.data &&
                res.data.result &&
                res.data.result.latest_block_time > tenSecondsAgo
              ) {
                return true
              }
              return false
            })
            .catch(e => {})
          if (nodeIsLegit) {
            resolve(rpcUrl)
          } else {
          }
        }
      })

      socket.on('error', e => {})
    })

    dc.join('fullnode:' + GCI)
  })
}

module.exports = getOnePeer
