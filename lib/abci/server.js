var net = require('net')
var Connection = require('./connection').Connection
var messages = require('./types_pb')
var valueCase = messages.Response.ValueCase

var reqMethodLookup = {
  info: 'info',
  setOption: 'setOption',
  deliverTx: 'deliverTx',
  checkTx: 'checkTx',
  commit: 'commit',
  query: 'query',
  initChain: 'initChain',
  beginBlock: 'beginBlock',
  endBlock: 'endBlock'
}

var responseEnum = {
  info: valueCase.INFO,
  setOption: valueCase.SET_OPTION,
  deliverTx: valueCase.DELIVER_TX,
  checkTx: valueCase.CHECK_TX,
  commit: valueCase.COMMIT,
  query: valueCase.QUERY,
  initChain: valueCase.INIT_CHAIN,
  beginBlock: valueCase.BEGIN_BLOCK,
  endBlock: valueCase.END_BLOCK,
  flush: valueCase.FLUSH,
  echo: valueCase.ECHO,
  exception: valueCase.EXCEPTION
}

var fieldsEnum = {
  lastBlockAppHash: 3,
}

// Takes an application and handles ABCI connection
// which invoke methods on the app
function Server(app) {
  // set the app for the socket handler
  this.app = app

  // create a server by providing callback for
  // accepting new connection and callbacks for
  // connection events ('data', 'end', etc.)
  this.createServer()
}

Server.prototype.createServer = function() {
  var app = this.app

  // Define the socket handler
  this.server = net.createServer(async function(socket) {
    //let types = await getTypes()
    //let { resMessageLookup, reqMethodLookup } = types
    socket.name = socket.remoteAddress + ':' + socket.remotePort

    var conn = new Connection(socket, async function(req, cb) {
      // var req = types.decodeRequest(reqBytes)
      let msgType
      for (let _msgType in req) {
        if (req[_msgType] !== undefined) {
          msgType = _msgType
          break
        }
      }

      var encodeMsg = function(emsg) {
        var data = {}

        for (var i in emsg[msgType]) {
          data[fieldsEnum[i]] = emsg[msgType][i]
        }

        if (data === {}) {
          data = emsg[msgType]
        }

        var encMsg = { [responseEnum[msgType] - 1]: data }
        var resBytes = new messages.Response(encMsg)
        return resBytes.serializeBinary()
      }

      // Special messages.
      // NOTE: msgs are length prefixed
      if (msgType == 'flush') {
        conn.writeMessage(encodeMsg({ flush: {} }))
        conn.flush()
        return cb()
      } else if (msgType == 'echo') {
        conn.writeMessage(encodeMsg({ echo: { message: req.echo.message} }))
        return cb()
      }

      // Make callback for apps to pass result.
      var resCb = respondOnce(function(resObj) {
        // Convert strings to utf8
        /*if (typeof resObj.data == "string") {
          resObj.data = new Buffer(resObj.data);
        }*/
        // Response type is always the same as req type
        // TODO: Add all types
        var resValue = { [msgType]: resObj }
        //let resBytes = tproto.Response.encode(resValue)
        conn.writeMessage(encodeMsg(resValue))
        cb() // Tells Connection that we're done responding.
      })

      // Call app function
      var reqMethod = reqMethodLookup[msgType]
      if (!reqMethod) {
        throw 'Unexpected request type ' + msgType
      }
      if (!app[reqMethod]) {
        console.log('Method not implemented: ' + reqMethod)
        resCb({})
      } else {
        var reqValue = req[msgType]
        var res;
        if (reqMethod === 'checkTx' || reqMethod === 'deliverTx') {
          res = await app[reqMethod].call(app, req, resCb)
        } else {
          res = app[reqMethod].call(app, req, resCb)
        }
      }
    })
  })
}

// Wrap a function to only be called once.
var respondOnce = function(f) {
  var ran = false
  return function() {
    if (ran) {
      console.log('Error: response was already written')
      console.log('arguments', arguments)
      return
    } else {
      ran = true
    }
    return f.apply(this, arguments)
  }
}

module.exports = {
  Server: Server
}
