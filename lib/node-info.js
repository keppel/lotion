let fs = require('fs')

module.exports = (lotionPath, lite) => {
  if (lite) {
    return {}
  }
  let validatorKeyInfo = JSON.parse(
    fs.readFileSync(lotionPath + '/priv_validator.json')
  )

  return { pubKey: validatorKeyInfo.pub_key.data }
}
