let merk = require('merk')

module.exports = async function getAppStateHash(store) {
  await merk.commit(store)
  let hash = Buffer.from(merk.hash(store), 'hex')
  return hash
}
