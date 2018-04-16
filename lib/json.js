let stableStringify = require('json-stable-stringify')

const base64Prefix = ':base64:'

// stringifies JSON deterministically, and converts Buffers to
// base64 strings (prefixed with ":base64:")
function stringify(obj) {
  let convertedObj = deepClone(obj, bufferToBase64Replacer)
  return stableStringify(convertedObj)
}

// parses JSON and converts strings with ":base64:" prefix to Buffers
function parse(json) {
  let obj = JSON.parse(json)
  return convertBase64ToBuffers(obj)
}

// clones an object, with a replacer function
function deepClone(obj, replacer) {
  let newObj = Array.isArray(obj) ? [] : {}
  Object.assign(newObj, obj)
  for (let key in newObj) {
    newObj[key] = replacer(newObj[key])
    if (typeof newObj[key] === 'object') {
      newObj[key] = deepClone(newObj[key], replacer)
    }
  }
  return newObj
}

function bufferToBase64Replacer(value) {
  // convert JSON.stringified Buffer objects to Buffer,
  // so they can get encoded to base64
  if (
    typeof value === 'object' &&
    value != null &&
    value.type === 'Buffer' &&
    Array.isArray(value.data)
  ) {
    value = Buffer.from(value)
  }
  if (!Buffer.isBuffer(value)) return value
  return `${base64Prefix}${value.toString('base64')}`
}
function base64ToBufferReplacer(value) {
  if (typeof value !== 'string') return value
  if (!value.startsWith(base64Prefix)) return value
  return Buffer.from(value.slice(base64Prefix.length), 'base64')
}

function convertBuffersToBase64(obj) {
  return replace(obj, bufferToBase64Replacer)
}

function convertBase64ToBuffers(obj) {
  return replace(obj, base64ToBufferReplacer)
}

// replaces values in an object without cloning
function replace(obj, replacer) {
  for (let key in obj) {
    obj[key] = replacer(obj[key])
    if (typeof obj[key] === 'object' && !Buffer.isBuffer(obj[key])) {
      // recursively replace props of objects (unless it's a Buffer)
      replace(obj[key], replacer)
    }
  }
  return obj
}

module.exports = {
  stringify,
  parse,
  convertBuffersToBase64,
  convertBase64ToBuffers
}
