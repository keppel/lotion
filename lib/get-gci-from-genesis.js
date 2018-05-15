let { createHash } = require('crypto')
let { stringify, parse } = require('deterministic-json')

module.exports = function(genesis) {
  let hash = createHash('sha256')
  let genesisJson = parse(genesis)
  let genesisStr = stringify(genesisJson)
  return hash.update(genesisStr, 'utf8').digest().toString('hex')
}
