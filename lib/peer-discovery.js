let swarm = require('discovery-swarm')
let getPort = require('get-port')
let axios = require('axios')

const DIAL_INTERVAL = 1000

module.exports = function start({ networkId, tendermintPort, p2pPort }) {
  let dial = dialSeeds.bind(null, tendermintPort)
  let peersToDial = []
  let hostsDialed = new Set()
  let sw = swarm({ maxConnections: 10 })
  getPort().then(swarmPort => {
    sw.listen(swarmPort)
    sw.join(networkId)
  })

  sw.on('connection', (conn, info) => {
    let host = info.host
    conn.on('data', data => {
      if (data.length === 2 && info.host.indexOf(':') === -1) {
        let port = data.readUInt16BE()
        peersToDial.push(info.host + ':' + port)
      }
      hostsDialed.add(info.host)
      conn.destroy()
    })
    let p2pPortBytes = Buffer(2)
    p2pPortBytes.writeUInt16BE(p2pPort)
    conn.write(p2pPortBytes)
  })

  let dialInterval = setInterval(() => {
    if (peersToDial.length) {
      dial(peersToDial)
      peersToDial = []
    }
  }, DIAL_INTERVAL)

  return {
    close: () => {
      clearInterval(dialInterval)
      sw.close()
    }
  }
}

function dialSeeds(tendermintPort, seeds = []) {
  return axios.get(
    `http://localhost:${tendermintPort}/dial_seeds?seeds=${JSON.stringify(seeds)}`
  )
}
