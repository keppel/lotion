let axios = require('axios')
let tendermintUrl = require('./binaries').tendermint[process.platform]
let fs = require('fs')
let unzip = require('unzip')
let path = require('path')
const isWin = /^win/.test(process.platform)

axios({
  url: tendermintUrl,
  method: 'get',
  responseType: 'stream'
}).then(function(response) {
  let ws = fs.createWriteStream(path.join(__dirname, '/tendermint' + isWin ? '.exe' : ''), { mode: 0o777 })
  response.data.pipe(unzip.Parse()).on('entry', function(entry) {
    entry.pipe(ws)
  })
})
