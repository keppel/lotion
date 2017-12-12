var wire = require('js-wire')

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
  var r = new wire.Reader(this.recvBuf)
  var msgBytes
  try {
    msgBytes = r.readByteArray()
  } catch (e) {
    return
  }
  this.recvBuf = r.buf.slice(r.offset)
  this.waitingResult = true
  this.socket.pause()
  try {
    this.msgCb(msgBytes, function() {
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
  var msgLength = wire.uvarintSize(msgBytes.length)
  var buf = new Buffer(1 + msgLength + msgBytes.length)
  var w = new wire.Writer(buf)
  w.writeByteArray(msgBytes) // TODO technically should be writeVarint
  this.sendBuf = Buffer.concat([this.sendBuf, w.getBuffer()])
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
