let axios = require('axios')

let url = 'http://localhost:3000'


async function main() {
  axios.post(url + '/txs', {})
  axios.post(url + '/txs', {})
  axios.post(url + '/txs', {})
  axios.post(url + '/txs', {})
  axios.post(url + '/txs', {})
}

main()
