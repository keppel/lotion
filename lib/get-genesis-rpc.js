let axios = require('axios')
let { stringify } = require('./json.js')

module.exports = function(url) {
  return new Promise(async (resolve, reject) => {
    let { data } = await axios.get(url + '/genesis')
    resolve(stringify(data.result.genesis))
  })
}
