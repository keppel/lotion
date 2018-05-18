let createServer = require('discovery-server')
let defaults = require('dat-swarm-defaults')({ utp: false })
let swarm = require('webrtc-swarm')
let signalhub = require('signalhub')

module.exports = function(GCI, genesis, tendermintPort, signalHub) {
  let server = createServer(defaults, function(socket) {
    socket.write(genesis)
    socket.end()
    socket.on('error', e => {})
  })

  if (signalHub) {
    let hub = signalhub(GCI, [signalHub])

    let sw = swarm(hub, {
      wrtc: require('wrtc') // don't need this if used in the browser
    })

    sw.on('peer', function (peer, id) {
      peer.send(tendermintPort.toString())
    })
  }

  server.listen(GCI, function() {})
}
