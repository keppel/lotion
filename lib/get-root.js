let { createHash } = require('crypto')
let merk = require('merk')

module.exports = async function getAppStateHash(store) {
  let sha256 = createHash('sha256')
  await merk.commit(store)
  let hash = sha256.update(merk.hash(store)).digest()
  // unless a merkle store is used, this will get slow when the state is big:
  return hash
}
