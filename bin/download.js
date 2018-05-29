let tendermintUrl = require('./binaries').tendermint[process.platform]
let fs = require('fs')
let unzip = require('unzip')
let wget = require('node-wget')

wget({url: tendermintUrl, dest: __dirname + "/tendermint.zip"}, (e) => {
  if (e != null) {
    console.log(e)
  } else {
    fs.createReadStream(__dirname + '/tendermint.zip')
      .pipe(unzip.Parse())
      .on('entry', function (entry) {
        entry.pipe(fs.createWriteStream(__dirname + '/tendermint',  { mode: 0o777 }));
        fs.unlinkSync(__dirname + '/tendermint.zip')
      });
  }
})
