let { createHash } = require('crypto')
let { stringify, parse } = require('deterministic-json')

module.exports = function(genesis) {
  let hash = createHash('sha256')
  // TODO: Check for genesisTime if needs to be hashed to get correct GCI
  let genesisJson = parse(genesis)
  genesisJson.genesis_time = "";
  let genesisStr = stringify(genesisJson)
  return hash.update(genesisStr, 'utf8').digest().toString('hex')
}
