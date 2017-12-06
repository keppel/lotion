let createServer = require('discovery-server')

module.exports = function(GCI, genesis) {
  let server = createServer({ utp: false }, function(socket) {
    socket.write(genesis)
    socket.end()
    socket.on('error', e => {})
  })

  server.listen(GCI, function() {})
}
