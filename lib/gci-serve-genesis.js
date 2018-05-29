let { serve } = require('jpfs')

module.exports = function(genesis) {
  let { hash, close } = serve(genesis)
  return { close, GCI: hash }
}
