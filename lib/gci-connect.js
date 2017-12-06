// function to connect as a light client to a chain by its GCI

module.exports = function connect(GCI) {
  return new Promise((resolve, reject) => {
    resolve({
      state: {},
      send: tx => {
        return new Promise(async (resolve, reject) => {})
      }
    })
  })
}
