let fs = require('fs')
let { join } = require('path')

module.exports = (lotionPath, lite) => {
  let validatorKeyInfo = JSON.parse(
    fs.readFileSync(join(lotionPath, 'config/priv_validator.json'))
  )

  const pubkeyAminoPrefix = Buffer.from('1624DE6220', 'hex')
  return {
    pubKey: Buffer.concat([
      pubkeyAminoPrefix,
      Buffer.from(validatorKeyInfo.pub_key.value, 'base64')
    ]).toString('base64')
  }
}
