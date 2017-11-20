let vstruct = require('varstruct')
let { stringify, parse } = require('./json.js')

let QueryStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) }
])

exports.decode = queryBuffer => {
  let decoded = QueryStruct.decode(queryBuffer)
  let query = parse(decoded.data)
  return query
}
exports.encode = queryData => {
  let data = stringify(queryData)
  let bytes = QueryStruct.encode({ data })
  return bytes
}
