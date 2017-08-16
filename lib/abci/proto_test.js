var types = require("./types");

// Testing protobufjs oneof
var request = new types.Request({
  deliver_tx: {
    tx: new Buffer("txbytes"),
  },
});
console.log("request", request);

var reqBytes = request.encode().toBuffer();
console.log(reqBytes);

var it = types.Request.decode(reqBytes);
console.log(it);
console.log(it.deliver_tx.toBuffer().length);
console.log(it.deliver_tx.tx.toBuffer().length);
