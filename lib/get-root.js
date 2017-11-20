let { createHash } = require('crypto')
let { stringify } = require('./json.js')

module.exports = function getAppStateHash(appState) {
  let sha256 = createHash('sha256')
  let hash = sha256.update(stringify(appState), 'utf8').digest()
  // unless a merkle store is used, this will get slow when the state is big:
  return hash
}
