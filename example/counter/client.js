let axios = require('axios')

async function main() {
  let { data } = await axios({
    method: 'post',
    url: 'http://localhost:3002/txs',
    params: { return_state: true },
    data: {
      value: 3
    }
  })
  console.log(data)
}

main()
