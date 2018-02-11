let { connect } = require('../../')

async function main() {
  let { send, state } = await connect(process.env.GCI)
  console.log(await state.foo.bar)
  console.log(await state)
}

main()
