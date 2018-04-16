var encodings = require('protocol-buffers-encodings')
var varint = encodings.varint
var int64 = encodings.int64
var messages = require('./types_pb')

var maxWriteBufferLength = 4096 // Any more and flush

function Connection(socket, msgCb) {
  this.socket = socket
  this.recvBuf = new Buffer(0)
  this.sendBuf = new Buffer(0)
  this.msgCb = msgCb
  this.waitingResult = false
  var conn = this

  // Handle ABCI requests.
  socket.on('data', function(data) {
    conn.appendData(data)
  })
}

Connection.prototype.appendData = function(bytes) {
  var conn = this
  if (bytes.length > 0) {
    this.recvBuf = Buffer.concat([this.recvBuf, new Buffer(bytes)])
  }
  if (this.waitingResult) {
    return
  }

  var msg = null;
  var msgLength = varint.decode(this.recvBuf)
  var skipBytes = varint.decode.bytes

  var r = this.recvBuf.slice(skipBytes, this.recvBuf.length)
  this.recvBuf = r;

  //TODO: check if length > 4096
  var r = this.recvBuf.slice(0, msgLength)

  try {
    var request = messages.Request.deserializeBinary(new Uint8Array(r))
    msg = request.toObject()
  } catch (e) {
    console.log(e)
    return
  }

  this.recvBuf = this.recvBuf.slice(msgLength, this.recvBuf.length)
  this.waitingResult = true
  this.socket.pause()
  try {
    this.msgCb(msg, function() {
      // This gets called after msg handler is finished with response.
      conn.waitingResult = false
      conn.socket.resume()
      if (conn.recvBuf.length > 0) {
        conn.appendData('')
      }
    })
  } catch (e) {
    if (e.stack) {
      console.log('FATAL ERROR STACK: ', e.stack)
    }
    console.log('FATAL ERROR: ', e)
  }
}

Connection.prototype.writeMessage = function(msgBytes) {
  var msgLength = new Buffer(varint.encode(msgBytes.length))
  var buf = Buffer.concat([msgLength, msgBytes])
  this.sendBuf = Buffer.concat([this.sendBuf, buf])
  if (this.sendBuf.length >= maxWriteBufferLength) {
    this.flush()
  }
}

Connection.prototype.flush = function() {
  var n = this.socket.write(this.sendBuf)
  this.sendBuf = new Buffer(0)
}

Connection.prototype.close = function() {
  this.socket.destroy()
}

module.exports = {
  Connection: Connection
}
