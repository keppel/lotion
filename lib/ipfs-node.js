let IPFS = require('ipfs')
let getPort = require('get-port')

module.exports = function start({ genesisJson, lotionPath }) {
  return new Promise(async (resolve, reject) => {
    let node = new IPFS({
      repo: lotionPath + '/ipfs',
      config: {
        Addresses: {
          Swarm: ['/ip4/0.0.0.0/tcp/' + (await getPort(4002))]
        }
      }
    })
    node.on('ready', () => {
      node.files.add(Buffer.from(genesisJson), (err, files) => {
        if (err) {
          throw new Error('Error adding genesis.json to ipfs: ' + err)
        }
        let GCI = files[0].hash
        resolve({ GCI, close: node.stop.bind(null, () => {}) })
      })
    })
  })
}
