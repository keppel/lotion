// test abci queries with a counter app

let axios = require('axios')
let test = require('tape-promise/tape')
let lotion = require('../index.js')
let rimraf = require('rimraf')
let { promisify } = require('util')

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getState() {
  return axios.get('http://localhost:3000/state').then(res => res.data)
}

async function main() {
  // configure lotion app to test against
  let app = lotion({
    initialState: {
      balances: {
        a: 100,
        b: 40
      }
    }
  })

  app.useQuery((state, query, result) => {
    console.log('did query:')
    console.log(query)
  })

  await app.listen(3000)

  test('query whole state', async t => {
    let state = await getState()
    t.equal(state.balances.a, 100)
    t.equal(state.balances.b, 40)
  })

  test('query specific account balance', async t => {
    console.log('querying...')
    let queryResponse = await axios.post('http://localhost:3000/query', {
      account: 'a'
    })
    console.log('got query response')
    console.log(queryResponse)
  })

  test('cleanup', t => {
    t.end()
    // process.exit()
    console.log('ctrl-c to exit')
  })
}

main()
