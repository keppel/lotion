let vstruct = require('varstruct')
let { stringify, parse } = require('deterministic-json')

let TxStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) },
  { name: 'nonce', type: vstruct.UInt32BE }
])

exports.decode = txBuffer => {
  let decoded = TxStruct.decode(txBuffer)
  let tx = parse(decoded.data)
  return tx
}
exports.encode = (txData, nonce) => {
  let data = stringify(txData)
  let bytes = TxStruct.encode({ nonce, data })
  return bytes
}
