function xport(exports, m) {
  for (var key in m) {
    exports[key] = m[key]
  }
}

var proto = require('protobufjs')

async function getTypes() {
  let types = require('./compiled.js')
  var reqMethodLookup = {}
  reqMethodLookup['info'] = 'info'
  reqMethodLookup['set_option'] = 'setOption'
  reqMethodLookup['deliver_tx'] = 'deliverTx'
  reqMethodLookup['check_tx'] = 'checkTx'
  reqMethodLookup['commit'] = 'commit'
  reqMethodLookup['query'] = 'query'
  reqMethodLookup['init_chain'] = 'initChain'
  reqMethodLookup['begin_block'] = 'beginBlock'
  reqMethodLookup['end_block'] = 'endBlock'

  var resMessageLookup = {}
  resMessageLookup['info'] = types.encodeResponseInfo
  resMessageLookup['set_option'] = types.encodeResponseSetOption
  resMessageLookup['deliver_tx'] = types.encodeResponseDeliverTx
  resMessageLookup['check_tx'] = types.encodeResponseCheckTx
  resMessageLookup['commit'] = types.encodeResponseCommit
  resMessageLookup['query'] = types.encodeResponseQuery
  resMessageLookup['init_chain'] = types.encodeResponseInitChain
  resMessageLookup['begin_block'] = types.encodeResponseBeginBlock
  resMessageLookup['end_block'] = types.encodeResponseEndBlock

  types.reqMethodLookup = reqMethodLookup
  types.resMessageLookup = resMessageLookup
  return types
}

module.exports = getTypes
