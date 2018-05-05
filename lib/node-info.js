let fs = require('fs')
let { join } = require('path')

module.exports = (lotionPath, lite) => {
  if (lite) {
    return {}
  }
  let validatorKeyInfo = JSON.parse(
    fs.readFileSync(join(lotionPath, 'config/priv_validator.json'))
  )

  return { pubKey: validatorKeyInfo.pub_key.value }
}
