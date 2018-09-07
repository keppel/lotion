let connect = require('../../lotion-connect/index.js')

async function main() {
  let { state, send } = await connect(process.env.GCI)

  console.log(await send({ foo: 'bar', shouldError: false }))

  console.log(await state)
}

main()
