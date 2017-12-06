let lotion = require('../../index.js')

lotion({ initialState: { count: 0 } })
  .use(state => state.count++)
  .listen(3000)
  .then(({ GCI }) => {
    console.log('@GCI:' + GCI)
  })
