var net = require('net')
let getTypes = require('./types')
var Connection = require('./connection').Connection

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
    let types = await getTypes()
    let { resMessageLookup, reqMethodLookup } = types
    socket.name = socket.remoteAddress + ':' + socket.remotePort

    var conn = new Connection(socket, function(reqBytes, cb) {
      var req = types.decodeRequest(reqBytes)
      let msgType
      for (let _msgType in req) {
        msgType = _msgType
        break
      }

      // Special messages.
      // NOTE: msgs are length prefixed
      if (msgType == 'flush') {
        var res = types.encodeResponse({
          flush: {}
        })
        conn.writeMessage(res)
        conn.flush()
        return cb()
      } else if (msgType == 'echo') {
        var res = types.encodeResponse({
          echo: { message: req.echo.message }
        })
        conn.writeMessage(res)
        return cb()
      }

      // Make callback for apps to pass result.
      var resCb = respondOnce(function(resObj) {
        // Convert strings to utf8
        /*if (typeof resObj.data == "string") {
          resObj.data = new Buffer(resObj.data);
        }*/
        // Response type is always the same as req type
        var resValue = { [msgType]: resObj }
        let resBytes = types.encodeResponse(resValue)
        conn.writeMessage(resBytes)
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
        var res = app[reqMethod].call(app, req, resCb)
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
