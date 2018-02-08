let { connect } = require('../../')

async function main() {
  let { getState, send } = await connect(process.env.GCI)
  console.log(await getState('foo.bar'))
}

process.on('unhandledRejection', e => {
  console.log(e)
})

main()
