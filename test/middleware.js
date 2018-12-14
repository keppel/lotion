let test = require('ava')
let getPort = require('get-port')
let lotion = require('..')
let { RpcClient } = require('tendermint')

test.cb('.use with legacy module format', (t) => {
  let app = lotion({ initialState: {} })

  let a, b
  app.use([
    {
      type: 'tx',
      middleware: () => a = true
    },
    {
      type: 'tx',
      middleware: () => b = true
    }
  ])

  app.start().then(async (res) => {
    console.log('connecting')
    let client = await lotion.connect(null, {
      peers: [ `localhost:${res.ports.rpc}` ]
    })
    console.log('connected')
    await client.send({ foo: 123 })
    t.is(a, true)
    t.is(b, true)
    t.end()
  })
})

test.cb('.use with module object format', (t) => {
  let app = lotion({ initialState: {} })

  let a
  app.use({
    txHandler: () => { a = true }
  })

  app.start().then(async (res) => {
    console.log('connecting')
    let client = await lotion.connect(null, {
      peers: [ `localhost:${res.ports.rpc}` ]
    })
    console.log('connected')
    await client.send({ foo: 123 })
    t.is(a, true)
    t.end()
  })
})

test.cb('.use with array of modules', (t) => {
  let app = lotion({ initialState: {} })

  let a, b
  app.use([
    { txHandler: () => { a = true } },
    { txHandler: () => { b = true } }
  ])

  app.start().then(async (res) => {
    console.log('connecting')
    let client = await lotion.connect(null, {
      peers: [ `localhost:${res.ports.rpc}` ]
    })
    console.log('connected')
    await client.send({ foo: 123 })
    t.is(a, true)
    t.is(b, true)
    t.end()
  })
})

test.cb('.use with function', (t) => {
  let app = lotion({ initialState: {} })

  let a
  app.use(() => { a = true })

  app.start().then(async (res) => {
    console.log('connecting')
    let client = await lotion.connect(null, {
      peers: [ `localhost:${res.ports.rpc}` ]
    })
    console.log('connected')
    await client.send({ foo: 123 })
    t.is(a, true)
    t.end()
  })
})

test.cb('.use with route function', (t) => {
  let app = lotion({ initialState: {} })

  let a
  app.use('foo', () => { a = true })

  app.start().then(async (res) => {
    console.log('connecting')
    let client = await lotion.connect(null, {
      peers: [ `localhost:${res.ports.rpc}` ]
    })
    console.log('connected')
    await client.send({ type: 'foo', bar: 123 })
    t.is(a, true)
    t.end()
  })
})
