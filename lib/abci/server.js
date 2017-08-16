var net = require('net')
var types = require('./types')
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
  this.server = net.createServer(function(socket) {
    socket.name = socket.remoteAddress + ':' + socket.remotePort

    var conn = new Connection(socket, function(reqBytes, cb) {
      var req = types.Request.decode(reqBytes)
      var msgType = req.value

      // Special messages.
      // NOTE: msgs are length prefixed
      if (msgType == 'flush') {
        var res = new types.Response({
          flush: new types.ResponseFlush()
        })
        conn.writeMessage(res)
        conn.flush()
        return cb()
      } else if (msgType == 'echo') {
        var res = new types.Response({
          echo: new types.ResponseEcho({ message: req.echo.message })
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
        resMessageType = types.resMessageLookup[msgType]
        var res = new types.Response()
        var resValue = new resMessageType(resObj)
        res.set(msgType, resValue)
        conn.writeMessage(res)
        cb() // Tells Connection that we're done responding.
      })

      // Call app function
      var reqMethod = types.reqMethodLookup[msgType]
      if (!reqMethod) {
        throw 'Unexpected request type ' + msgType
      }
      if (!app[reqMethod]) {
        console.log('Method not implemented: ' + reqMethod)
        resCb({})
      } else {
        var reqValue = req[msgType]
        var res = app[reqMethod].call(app, req, resCb)
        if (res != undefined) {
          console.log("Message handler shouldn't return anything!")
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
