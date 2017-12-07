let { createHash } = require('crypto')

module.exports = function(genesis) {
  let hash = createHash('sha256')
  return hash.update(genesis, 'utf8').digest().toString('hex')
}
