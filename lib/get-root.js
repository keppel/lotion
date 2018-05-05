let merk = require('merk')
let { createHash } = require('crypto')
let { stringify } = require('deterministic-json')

module.exports = async function getAppStateHash(store) {
  let hash = createHash('sha256')
    .update(stringify(store))
    .digest()

  return hash
}
