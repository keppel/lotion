let fs = require('fs')
let { PrivKey } = require('tendermint-keys')

module.exports = lotionPath => {
  let validatorKeyInfo = JSON.parse(
    fs.readFileSync(lotionPath + '/priv_validator.json')
  )

  return { pubKey: validatorKeyInfo.pub_key.data }
}
