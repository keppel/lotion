function xport(exports, m) {
  for (var key in m) {
    exports[key] = m[key]
  }
}

var proto = require('protobufjs')
var protoPath = require('path').join(__dirname, 'types.proto') // TODO: better to just compile this into a js file.
var builder = proto.loadProtoFile(protoPath)
var types = builder.build('types')

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
resMessageLookup['info'] = types.ResponseInfo
resMessageLookup['set_option'] = types.ResponseSetOption
resMessageLookup['deliver_tx'] = types.ResponseDeliverTx
resMessageLookup['check_tx'] = types.ResponseCheckTx
resMessageLookup['commit'] = types.ResponseCommit
resMessageLookup['query'] = types.ResponseQuery
resMessageLookup['init_chain'] = types.ResponseInitChain
resMessageLookup['begin_block'] = types.ResponseBeginBlock
resMessageLookup['end_block'] = types.ResponseEndBlock

module.exports = types
module.exports.reqMethodLookup = reqMethodLookup
module.exports.resMessageLookup = resMessageLookup
