let createServer = require('discovery-server')

module.exports = function(GCI, genesis) {
  let server = createServer({ utp: false }, function(socket) {
    socket.write(genesis)
    socket.end()
  })

  server.listen(GCI, function() {})
}
