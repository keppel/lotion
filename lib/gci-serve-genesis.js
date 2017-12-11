let createServer = require('discovery-server')
let defaults = require('dat-swarm-defaults')({ utp: false })

module.exports = function(GCI, genesis) {
  let server = createServer(defaults, function(socket) {
    socket.write(genesis)
    socket.end()
    socket.on('error', e => {})
  })

  server.listen(GCI, function() {})
}
