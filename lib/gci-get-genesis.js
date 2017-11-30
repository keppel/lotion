// function that fetches genesis.json via ipfs from the GCI

module.exports = function fetchGenesis(GCI, node) {
  return new Promise(async (resolve, reject) => {
    resolve(await node.get(GCI))
  })
}
