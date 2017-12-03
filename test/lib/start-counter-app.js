let execa = require('execa')

function start() {
  return new Promise(async (resolve, reject) => {
    console.log('starting counter app')
    execa('node', [__dirname + '/counter-app.js']).stdout.on('data', chunk => {
      if (chunk.toString().indexOf('@GCI:') !== -1) {
        resolve(chunk.toString().split('@GCI:')[1].trim())
      }
    })
  })
}

module.exports = start
