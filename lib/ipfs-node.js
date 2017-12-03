let IPFS = require('ipfs')
let getPort = require('get-port')

let node

module.exports = function start({ lotionPath }) {
  return new Promise(async (resolve, reject) => {
    if (!node) {
      node = new IPFS({
        repo: lotionPath + '/ipfs' + Math.floor(Math.random() * 1e12),
        config: {
          Addresses: {
            Swarm: ['/ip4/0.0.0.0/tcp/' + (await getPort(4002))]
          }
        }
      })
    } else {
      process.nextTick(() => node.emit('ready'))
    }

    node.once('ready', () => {
      resolve({
        add: data => {
          return new Promise((resolve, reject) => {
            node.files.add(Buffer.from(data), (err, files) => {
              if (err) {
                throw new Error('Error adding data to ipfs: ' + err)
              }
              let hash = files[0].hash
              console.log('hash:')
              console.log(hash)
              resolve(hash)
            })
          })
        },

        get: hash => {
          return new Promise((resolve, reject) => {
            let data = ''
            node.files.cat(hash, (err, file) => {
              file.on('data', chunk => data += chunk.toString())
              file.on('end', () => {
                resolve(data)
              })
            })
          })
        },

        close: () => {
          node.stop()
        }
      })
    })
  })
}
