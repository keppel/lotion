let axios = require('axios')
let tendermintUrl = require('./binaries').tendermint[process.platform]
let fs = require('fs')
let unzip = require('unzip')

axios({
  url: tendermintUrl,
  method: 'get',
  responseType: 'stream'
}).then(function(response) {
  let ws = fs.createWriteStream(__dirname + '/tendermint', { mode: 0o777 })
  response.data.pipe(unzip.Parse()).on('entry', function(entry) {
    entry.pipe(ws)
  })
})
