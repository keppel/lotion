// let { createServer } = require('peer-channel')
// let { serve } = require('jpfs')
//
// function announce(GCI: string, rpcPort: number) {
//   let server = createServer(function(socket) {
//     socket.send('' + rpcPort)
//     socket.end()
//
//     socket.on('error', e => {})
//   })
//
//   server.listen('fullnode:' + GCI)
//   return server
// }
//
// export interface DiscoveryServer {
//   close()
// }
//
// interface DiscoveryInfo {
//   GCI: string
//   genesis: string
//   rpcPort: number
// }
//
// export default function(info: DiscoveryInfo) {
//   let announceServer = announce(info.GCI, info.rpcPort)
//   let genesisServer = serve(info.genesis)
//
//   return {
//     close() {
//       announceServer.close()
//       genesisServer.close()
//     }
//   }
// }
