let vstruct = require('varstruct')
let { stringify, parse } = require('./json.js')

let TxStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) },
  { name: 'nonce', type: vstruct.UInt32BE },
])

exports.decode = txBuffer => {
  // Convert base64 buffer to buffer
  var buffer = new Buffer(txBuffer, 'base64')
  let decoded = TxStruct.decode(buffer)
  let tx = parse(decoded.data)
  return tx
}
exports.encode = (txData, nonce) => {
  let data = stringify(txData)
  let bytes = TxStruct.encode({ nonce, data })
  return bytes
}
