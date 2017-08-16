var net = require("net");
var types = require("./types");
var Connection = require("./connection").Connection;

// "tcp://127.0.0.1:46658" -> {host,port}
// "unix://path" -> {path}
function ParseAddr(addr) {
  if (addr.startsWith("tcp://")) {
    var hostPort = addr.substr(6).split(":");
    return {host: hostPort[0], port: hostPort[1]};
  }
  if (addr.startsWith("unix://")) {
    return {path: addr.substr(7)};
  }
}

// TODO: Handle auto-reconnect & re-sending requests.
function Client(addr) {
  this.error = undefined;
  this.addr = addr;
  this.reqResQ = []; // stores [{req,res,cb}...]
  this.reqResQSendPtr = 0; // next request to send
  this.conn = null;
  this._connect();
}

Client.prototype._connect = function() {
  var addrObj = ParseAddr(this.addr);
  var socket = net.connect(addrObj, () => {
    this.conn = new Connection(socket, (resBytes, cb) => { this.onResponse(resBytes, cb); });
    this.wakeSender();
  });
}

Client.prototype.onResponse = function(resBytes, cb) {
  var res = types.Response.decode(resBytes);
  if (res.value === "exception") {
    this.setError(res[0]);
    return;
  }
  if (this.reqResQ.length == 0) {
    this.setError("Unexpected response: "+resBytes.toString("hex"));
    return;
  }
  var reqRes = this.reqResQ[0];
  if (res.value !== reqRes.req.value) {
    this.setError("Unexpected response type: "+resBytes.toString("hex"));
    return;
  }
  if (!!reqRes.cb) {
    reqRes.cb(res);
  }
  // TODO: we'll want to do something more intelligent
  // in the future to handle reconnects; e.g. resend requests.
  this.reqResQ.shift();
  this.reqResQSendPtr--;
  cb();
}

Client.prototype.setError = function(error) {
  if (!this.error) {
    this.error = error;
  }
}

Client.prototype.flush = function(cb) {
  var reqObj = {};
  this.queueRequest("flush", reqObj, cb);
}

Client.prototype.info = function(cb) {
  var reqObj = {};
  this.queueRequest("info", reqObj, cb);
}

Client.prototype.setOption = function(key, value, cb) {
  var reqObj = {key:key, value:value};
  this.queueRequest("set_option", reqObj, cb);
}

Client.prototype.deliverTx = function(txBytes, cb) {
  var reqObj = {tx:txBytes};
  this.queueRequest("deliver_tx", reqObj, cb);
}

Client.prototype.checkTx = function(txBytes, cb) {
  var reqObj = {tx:txBytes};
  this.queueRequest("check_tx", reqObj, cb);
}

Client.prototype.commit = function(cb) {
  var reqObj = {};
  this.queueRequest("commit", reqObj, cb);
}

Client.prototype.query = function(data, path, height, prove, cb) {
  var reqObj = {data:data, path:path, height:height, prove:prove};
  this.queueRequest("query", reqObj, cb);
}

Client.prototype.initChain = function(cb) {
  var reqObj = {};
  this.queueRequest("init_chain", reqObj, cb);
}

Client.prototype.beginBlock = function(cb) {
  var reqObj = {};
  this.queueRequest("begin_block", reqObj, cb);
}

Client.prototype.endBlock = function(cb) {
  var reqObj = {};
  this.queueRequest("end_block", reqObj, cb);
}

Client.prototype.queueRequest = function(type, reqObj, cb) {
  if (typeof type === "undefined") {
    throw "queueRequest cannot handle undefined types";
  }
  var reqObjWrapper = {};
  reqObjWrapper[type] = reqObj;
  var req = new types.Request(reqObjWrapper);
  var reqRes = {req:req,cb:cb};
  console.log("!!!", req)
  this.reqResQ.push(reqRes);
  this.wakeSender();
}

Client.prototype.wakeSender = function() {
  if (!this.conn) {
    // wakeSender gets called again upon connection est.
    return;
  }
  if (!this.sending) {
    this.sending = true;
    setTimeout(
      ()=>{this.sendRequest()},
      0
    );
  }
}

Client.prototype.sendRequest = function() {
  // Get next request to send
  var nextReqRes = this.reqResQ[this.reqResQSendPtr];
  if (!nextReqRes) {
    // NOTE: this case is duplicated at the end of this function
    this.sending = false;
    return // Nothing to send, we're done!
  }
  // Send request
  var req = nextReqRes.req;
  this.conn.writeMessage(req);
  this.reqResQSendPtr++;
  // Also flush maybe
  if (req.value == "flush") {
    this.conn.flush();
  }
  // If we have more messages to send...
  if (this.reqResQ.length > this.reqResQSendPtr) {
    setTimeout(
      ()=>{this.sendRequest()},
      0
    ); // TODO: benchmark this; batch it if slow.
  } else {
    // NOTE: this case is duplicated at the start of this function
    this.sending = false;
    return // Nothing to send, we're done!
  }
}

Client.prototype.close = function() {
  this.conn.close();
}

module.exports = {
  Client: Client,
  ParseAddr: ParseAddr,
};
