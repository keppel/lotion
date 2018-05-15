let { serve } = require('jpfs')

module.exports = function(GCI, genesis) {
  let { hash, close } = serve(genesis)
}
