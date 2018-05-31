let axios = require('axios')
let tendermintUrl
if ((process.arch == "arm") && (process.platform == "linux")) {
  tendermintUrl = "https://github.com/tendermint/tendermint/releases/download/v0.15.0/tendermint_0.15.0_linux_arm.zip"
} else {
  tendermintUrl = require('./binaries').tendermint[process.platform]
}
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
