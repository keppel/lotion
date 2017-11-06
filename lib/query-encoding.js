let vstruct = require('varstruct')
let stringify = require('json-stable-stringify')
let QueryStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) }
])

exports.decode = queryBuffer => {
  let decoded = QueryStruct.decode(queryBuffer)
  let query = JSON.parse(decoded.data)
  return tx
}
exports.encode = (queryData, nonce) => {
  let data = stringify(queryData)
  let bytes = QueryStruct.encode({ data })
  return bytes
}
