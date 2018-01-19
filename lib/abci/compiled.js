var types = types || exports || {}, exports;
var ByteBuffer = ByteBuffer || require("bytebuffer");
types.Long = ByteBuffer.Long;

(function(undefined) {

  function pushTemporaryLength(buffer) {
    var length = buffer.readVarint32();
    var limit = buffer.limit;
    buffer.limit = buffer.offset + length;
    return limit;
  }

  function skipUnknownField(buffer, type) {
    switch (type) {
      case 0: while (buffer.readByte() & 0x80) {} break;
      case 2: buffer.skip(buffer.readVarint32()); break;
      case 5: buffer.skip(4); break;
      case 1: buffer.skip(8); break;
      default: throw new Error("Unimplemented type: " + type);
    }
  }

  function coerceLong(value) {
    if (!(value instanceof ByteBuffer.Long) && "low" in value && "high" in value)
      value = new ByteBuffer.Long(value.low, value.high, value.unsigned);
    return value;
  }

  types["encodeRequest"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional RequestEcho echo = 2;
    var value = message["echo"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodeRequestEcho"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestFlush flush = 3;
    var value = message["flush"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = types["encodeRequestFlush"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestInfo info = 4;
    var value = message["info"];
    if (value !== undefined) {
      buffer.writeVarint32(34);
      var nested = types["encodeRequestInfo"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestSetOption set_option = 5;
    var value = message["set_option"];
    if (value !== undefined) {
      buffer.writeVarint32(42);
      var nested = types["encodeRequestSetOption"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestInitChain init_chain = 6;
    var value = message["init_chain"];
    if (value !== undefined) {
      buffer.writeVarint32(50);
      var nested = types["encodeRequestInitChain"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestQuery query = 7;
    var value = message["query"];
    if (value !== undefined) {
      buffer.writeVarint32(58);
      var nested = types["encodeRequestQuery"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestBeginBlock begin_block = 8;
    var value = message["begin_block"];
    if (value !== undefined) {
      buffer.writeVarint32(66);
      var nested = types["encodeRequestBeginBlock"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestCheckTx check_tx = 9;
    var value = message["check_tx"];
    if (value !== undefined) {
      buffer.writeVarint32(74);
      var nested = types["encodeRequestCheckTx"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestDeliverTx deliver_tx = 19;
    var value = message["deliver_tx"];
    if (value !== undefined) {
      buffer.writeVarint32(154);
      var nested = types["encodeRequestDeliverTx"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestEndBlock end_block = 11;
    var value = message["end_block"];
    if (value !== undefined) {
      buffer.writeVarint32(90);
      var nested = types["encodeRequestEndBlock"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional RequestCommit commit = 12;
    var value = message["commit"];
    if (value !== undefined) {
      buffer.writeVarint32(98);
      var nested = types["encodeRequestCommit"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequest"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional RequestEcho echo = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["echo"] = types["decodeRequestEcho"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestFlush flush = 3;
      case 3:
        var limit = pushTemporaryLength(buffer);
        message["flush"] = types["decodeRequestFlush"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestInfo info = 4;
      case 4:
        var limit = pushTemporaryLength(buffer);
        message["info"] = types["decodeRequestInfo"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestSetOption set_option = 5;
      case 5:
        var limit = pushTemporaryLength(buffer);
        message["set_option"] = types["decodeRequestSetOption"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestInitChain init_chain = 6;
      case 6:
        var limit = pushTemporaryLength(buffer);
        message["init_chain"] = types["decodeRequestInitChain"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestQuery query = 7;
      case 7:
        var limit = pushTemporaryLength(buffer);
        message["query"] = types["decodeRequestQuery"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestBeginBlock begin_block = 8;
      case 8:
        var limit = pushTemporaryLength(buffer);
        message["begin_block"] = types["decodeRequestBeginBlock"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestCheckTx check_tx = 9;
      case 9:
        var limit = pushTemporaryLength(buffer);
        message["check_tx"] = types["decodeRequestCheckTx"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestDeliverTx deliver_tx = 19;
      case 19:
        var limit = pushTemporaryLength(buffer);
        message["deliver_tx"] = types["decodeRequestDeliverTx"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestEndBlock end_block = 11;
      case 11:
        var limit = pushTemporaryLength(buffer);
        message["end_block"] = types["decodeRequestEndBlock"](buffer);
        buffer.limit = limit;
        break;

      // optional RequestCommit commit = 12;
      case 12:
        var limit = pushTemporaryLength(buffer);
        message["commit"] = types["decodeRequestCommit"](buffer);
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestEcho"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string message = 1;
    var value = message["message"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestEcho"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string message = 1;
      case 1:
        message["message"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestFlush"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    return buffer.flip().toBuffer();
  };

  types["decodeRequestFlush"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestInfo"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string version = 1;
    var value = message["version"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestInfo"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string version = 1;
      case 1:
        message["version"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestSetOption"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string key = 1;
    var value = message["key"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional string value = 2;
    var value = message["value"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestSetOption"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string key = 1;
      case 1:
        message["key"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional string value = 2;
      case 2:
        message["value"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestInitChain"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // repeated Validator validators = 1;
    var values = message["validators"];
    if (values !== undefined) {
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var nested = types["encodeValidator"](value);
        buffer.writeVarint32(10);
        buffer.writeVarint32(nested.byteLength), buffer.append(nested);
      }
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestInitChain"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated Validator validators = 1;
      case 1:
        var limit = pushTemporaryLength(buffer);
        var values = message["validators"] || (message["validators"] = []);
        values.push(types["decodeValidator"](buffer));
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestQuery"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes data = 1;
    var value = message["data"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional string path = 2;
    var value = message["path"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional int64 height = 3;
    var value = message["height"];
    if (value !== undefined) {
      buffer.writeVarint32(24);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional bool prove = 4;
    var value = message["prove"];
    if (value !== undefined) {
      buffer.writeVarint32(32);
      buffer.writeByte(value ? 1 : 0);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestQuery"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes data = 1;
      case 1:
        message["data"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional string path = 2;
      case 2:
        message["path"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional int64 height = 3;
      case 3:
        message["height"] = buffer.readVarint64();
        break;

      // optional bool prove = 4;
      case 4:
        message["prove"] = !!buffer.readByte();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestBeginBlock"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes hash = 1;
    var value = message["hash"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional Header header = 2;
    var value = message["header"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodeHeader"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // repeated int32 absent_validators = 3;
    var values = message["absent_validators"];
    if (values !== undefined) {
      var packed = new ByteBuffer(undefined, true)
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        packed.writeVarint64(value | 0);
      }
      buffer.writeVarint32(26);
      buffer.writeVarint32(packed.flip().limit);
      buffer.append(packed);
    }

    // repeated Evidence byzantine_validators = 4;
    var values = message["byzantine_validators"];
    if (values !== undefined) {
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var nested = types["encodeEvidence"](value);
        buffer.writeVarint32(34);
        buffer.writeVarint32(nested.byteLength), buffer.append(nested);
      }
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestBeginBlock"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes hash = 1;
      case 1:
        message["hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional Header header = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["header"] = types["decodeHeader"](buffer);
        buffer.limit = limit;
        break;

      // repeated int32 absent_validators = 3;
      case 3:
        var values = message["absent_validators"] || (message["absent_validators"] = []);
        if ((tag & 7) === 2) {
          var outerLimit = pushTemporaryLength(buffer);
          while (buffer.remaining() > 0) {
            values.push(buffer.readVarint32());
          }
          buffer.limit = outerLimit;
        } else {
          values.push(buffer.readVarint32());
        }
        break;

      // repeated Evidence byzantine_validators = 4;
      case 4:
        var limit = pushTemporaryLength(buffer);
        var values = message["byzantine_validators"] || (message["byzantine_validators"] = []);
        values.push(types["decodeEvidence"](buffer));
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestCheckTx"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes tx = 1;
    var value = message["tx"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestCheckTx"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes tx = 1;
      case 1:
        message["tx"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestDeliverTx"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes tx = 1;
    var value = message["tx"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestDeliverTx"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes tx = 1;
      case 1:
        message["tx"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestEndBlock"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional int64 height = 1;
    var value = message["height"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeRequestEndBlock"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int64 height = 1;
      case 1:
        message["height"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeRequestCommit"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    return buffer.flip().toBuffer();
  };

  types["decodeRequestCommit"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponse"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional ResponseException exception = 1;
    var value = message["exception"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = types["encodeResponseException"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseEcho echo = 2;
    var value = message["echo"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodeResponseEcho"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseFlush flush = 3;
    var value = message["flush"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = types["encodeResponseFlush"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseInfo info = 4;
    var value = message["info"];
    if (value !== undefined) {
      buffer.writeVarint32(34);
      var nested = types["encodeResponseInfo"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseSetOption set_option = 5;
    var value = message["set_option"];
    if (value !== undefined) {
      buffer.writeVarint32(42);
      var nested = types["encodeResponseSetOption"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseInitChain init_chain = 6;
    var value = message["init_chain"];
    if (value !== undefined) {
      buffer.writeVarint32(50);
      var nested = types["encodeResponseInitChain"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseQuery query = 7;
    var value = message["query"];
    if (value !== undefined) {
      buffer.writeVarint32(58);
      var nested = types["encodeResponseQuery"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseBeginBlock begin_block = 8;
    var value = message["begin_block"];
    if (value !== undefined) {
      buffer.writeVarint32(66);
      var nested = types["encodeResponseBeginBlock"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseCheckTx check_tx = 9;
    var value = message["check_tx"];
    if (value !== undefined) {
      buffer.writeVarint32(74);
      var nested = types["encodeResponseCheckTx"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseDeliverTx deliver_tx = 10;
    var value = message["deliver_tx"];
    if (value !== undefined) {
      buffer.writeVarint32(82);
      var nested = types["encodeResponseDeliverTx"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseEndBlock end_block = 11;
    var value = message["end_block"];
    if (value !== undefined) {
      buffer.writeVarint32(90);
      var nested = types["encodeResponseEndBlock"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional ResponseCommit commit = 12;
    var value = message["commit"];
    if (value !== undefined) {
      buffer.writeVarint32(98);
      var nested = types["encodeResponseCommit"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponse"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional ResponseException exception = 1;
      case 1:
        var limit = pushTemporaryLength(buffer);
        message["exception"] = types["decodeResponseException"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseEcho echo = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["echo"] = types["decodeResponseEcho"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseFlush flush = 3;
      case 3:
        var limit = pushTemporaryLength(buffer);
        message["flush"] = types["decodeResponseFlush"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseInfo info = 4;
      case 4:
        var limit = pushTemporaryLength(buffer);
        message["info"] = types["decodeResponseInfo"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseSetOption set_option = 5;
      case 5:
        var limit = pushTemporaryLength(buffer);
        message["set_option"] = types["decodeResponseSetOption"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseInitChain init_chain = 6;
      case 6:
        var limit = pushTemporaryLength(buffer);
        message["init_chain"] = types["decodeResponseInitChain"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseQuery query = 7;
      case 7:
        var limit = pushTemporaryLength(buffer);
        message["query"] = types["decodeResponseQuery"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseBeginBlock begin_block = 8;
      case 8:
        var limit = pushTemporaryLength(buffer);
        message["begin_block"] = types["decodeResponseBeginBlock"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseCheckTx check_tx = 9;
      case 9:
        var limit = pushTemporaryLength(buffer);
        message["check_tx"] = types["decodeResponseCheckTx"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseDeliverTx deliver_tx = 10;
      case 10:
        var limit = pushTemporaryLength(buffer);
        message["deliver_tx"] = types["decodeResponseDeliverTx"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseEndBlock end_block = 11;
      case 11:
        var limit = pushTemporaryLength(buffer);
        message["end_block"] = types["decodeResponseEndBlock"](buffer);
        buffer.limit = limit;
        break;

      // optional ResponseCommit commit = 12;
      case 12:
        var limit = pushTemporaryLength(buffer);
        message["commit"] = types["decodeResponseCommit"](buffer);
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseException"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string error = 1;
    var value = message["error"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseException"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string error = 1;
      case 1:
        message["error"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseEcho"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string message = 1;
    var value = message["message"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseEcho"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string message = 1;
      case 1:
        message["message"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseFlush"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    return buffer.flip().toBuffer();
  };

  types["decodeResponseFlush"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseInfo"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string data = 1;
    var value = message["data"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional string version = 2;
    var value = message["version"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional int64 last_block_height = 3;
    var value = message["last_block_height"];
    if (value !== undefined) {
      buffer.writeVarint32(24);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional bytes last_block_app_hash = 4;
    var value = message["last_block_app_hash"];
    if (value !== undefined) {
      buffer.writeVarint32(34);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseInfo"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string data = 1;
      case 1:
        message["data"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional string version = 2;
      case 2:
        message["version"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional int64 last_block_height = 3;
      case 3:
        message["last_block_height"] = buffer.readVarint64();
        break;

      // optional bytes last_block_app_hash = 4;
      case 4:
        message["last_block_app_hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseSetOption"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional uint32 code = 1;
    var value = message["code"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint32(value);
    }

    // optional string log = 2;
    var value = message["log"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseSetOption"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint32 code = 1;
      case 1:
        message["code"] = buffer.readVarint32() >>> 0;
        break;

      // optional string log = 2;
      case 2:
        message["log"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseInitChain"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    return buffer.flip().toBuffer();
  };

  types["decodeResponseInitChain"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseQuery"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional uint32 code = 1;
    var value = message["code"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint32(value);
    }

    // optional int64 index = 2;
    var value = message["index"];
    if (value !== undefined) {
      buffer.writeVarint32(16);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional bytes key = 3;
    var value = message["key"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional bytes value = 4;
    var value = message["value"];
    if (value !== undefined) {
      buffer.writeVarint32(34);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional bytes proof = 5;
    var value = message["proof"];
    if (value !== undefined) {
      buffer.writeVarint32(42);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional int64 height = 6;
    var value = message["height"];
    if (value !== undefined) {
      buffer.writeVarint32(48);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional string log = 7;
    var value = message["log"];
    if (value !== undefined) {
      buffer.writeVarint32(58);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseQuery"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint32 code = 1;
      case 1:
        message["code"] = buffer.readVarint32() >>> 0;
        break;

      // optional int64 index = 2;
      case 2:
        message["index"] = buffer.readVarint64();
        break;

      // optional bytes key = 3;
      case 3:
        message["key"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional bytes value = 4;
      case 4:
        message["value"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional bytes proof = 5;
      case 5:
        message["proof"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional int64 height = 6;
      case 6:
        message["height"] = buffer.readVarint64();
        break;

      // optional string log = 7;
      case 7:
        message["log"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseBeginBlock"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    return buffer.flip().toBuffer();
  };

  types["decodeResponseBeginBlock"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseCheckTx"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional uint32 code = 1;
    var value = message["code"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint32(value);
    }

    // optional bytes data = 2;
    var value = message["data"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional string log = 3;
    var value = message["log"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional int64 gas = 4;
    var value = message["gas"];
    if (value !== undefined) {
      buffer.writeVarint32(32);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional int64 fee = 5;
    var value = message["fee"];
    if (value !== undefined) {
      buffer.writeVarint32(40);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseCheckTx"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint32 code = 1;
      case 1:
        message["code"] = buffer.readVarint32() >>> 0;
        break;

      // optional bytes data = 2;
      case 2:
        message["data"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional string log = 3;
      case 3:
        message["log"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional int64 gas = 4;
      case 4:
        message["gas"] = buffer.readVarint64();
        break;

      // optional int64 fee = 5;
      case 5:
        message["fee"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseDeliverTx"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional uint32 code = 1;
    var value = message["code"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint32(value);
    }

    // optional bytes data = 2;
    var value = message["data"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional string log = 3;
    var value = message["log"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // repeated KVPair tags = 4;
    var values = message["tags"];
    if (values !== undefined) {
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var nested = types["encodeKVPair"](value);
        buffer.writeVarint32(34);
        buffer.writeVarint32(nested.byteLength), buffer.append(nested);
      }
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseDeliverTx"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint32 code = 1;
      case 1:
        message["code"] = buffer.readVarint32() >>> 0;
        break;

      // optional bytes data = 2;
      case 2:
        message["data"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional string log = 3;
      case 3:
        message["log"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // repeated KVPair tags = 4;
      case 4:
        var limit = pushTemporaryLength(buffer);
        var values = message["tags"] || (message["tags"] = []);
        values.push(types["decodeKVPair"](buffer));
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseEndBlock"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // repeated Validator validator_updates = 1;
    var values = message["validator_updates"];
    if (values !== undefined) {
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var nested = types["encodeValidator"](value);
        buffer.writeVarint32(10);
        buffer.writeVarint32(nested.byteLength), buffer.append(nested);
      }
    }

    // optional ConsensusParams consensus_param_updates = 2;
    var value = message["consensus_param_updates"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodeConsensusParams"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseEndBlock"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated Validator validator_updates = 1;
      case 1:
        var limit = pushTemporaryLength(buffer);
        var values = message["validator_updates"] || (message["validator_updates"] = []);
        values.push(types["decodeValidator"](buffer));
        buffer.limit = limit;
        break;

      // optional ConsensusParams consensus_param_updates = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["consensus_param_updates"] = types["decodeConsensusParams"](buffer);
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeResponseCommit"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional uint32 code = 1;
    var value = message["code"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint32(value);
    }

    // optional bytes data = 2;
    var value = message["data"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional string log = 3;
    var value = message["log"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeResponseCommit"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint32 code = 1;
      case 1:
        message["code"] = buffer.readVarint32() >>> 0;
        break;

      // optional bytes data = 2;
      case 2:
        message["data"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional string log = 3;
      case 3:
        message["log"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeConsensusParams"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional BlockSize block_size = 1;
    var value = message["block_size"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = types["encodeBlockSize"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional TxSize tx_size = 2;
    var value = message["tx_size"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodeTxSize"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional BlockGossip block_gossip = 3;
    var value = message["block_gossip"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = types["encodeBlockGossip"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeConsensusParams"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional BlockSize block_size = 1;
      case 1:
        var limit = pushTemporaryLength(buffer);
        message["block_size"] = types["decodeBlockSize"](buffer);
        buffer.limit = limit;
        break;

      // optional TxSize tx_size = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["tx_size"] = types["decodeTxSize"](buffer);
        buffer.limit = limit;
        break;

      // optional BlockGossip block_gossip = 3;
      case 3:
        var limit = pushTemporaryLength(buffer);
        message["block_gossip"] = types["decodeBlockGossip"](buffer);
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeBlockSize"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional int32 max_bytes = 1;
    var value = message["max_bytes"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint64(value | 0);
    }

    // optional int32 max_txs = 2;
    var value = message["max_txs"];
    if (value !== undefined) {
      buffer.writeVarint32(16);
      buffer.writeVarint64(value | 0);
    }

    // optional int64 max_gas = 3;
    var value = message["max_gas"];
    if (value !== undefined) {
      buffer.writeVarint32(24);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeBlockSize"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 max_bytes = 1;
      case 1:
        message["max_bytes"] = buffer.readVarint32();
        break;

      // optional int32 max_txs = 2;
      case 2:
        message["max_txs"] = buffer.readVarint32();
        break;

      // optional int64 max_gas = 3;
      case 3:
        message["max_gas"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeTxSize"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional int32 max_bytes = 1;
    var value = message["max_bytes"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint64(value | 0);
    }

    // optional int64 max_gas = 2;
    var value = message["max_gas"];
    if (value !== undefined) {
      buffer.writeVarint32(16);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeTxSize"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 max_bytes = 1;
      case 1:
        message["max_bytes"] = buffer.readVarint32();
        break;

      // optional int64 max_gas = 2;
      case 2:
        message["max_gas"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeBlockGossip"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional int32 block_part_size_bytes = 1;
    var value = message["block_part_size_bytes"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint64(value | 0);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeBlockGossip"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 block_part_size_bytes = 1;
      case 1:
        message["block_part_size_bytes"] = buffer.readVarint32();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeHeader"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string chain_id = 1;
    var value = message["chain_id"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional int64 height = 2;
    var value = message["height"];
    if (value !== undefined) {
      buffer.writeVarint32(16);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional int64 time = 3;
    var value = message["time"];
    if (value !== undefined) {
      buffer.writeVarint32(24);
      buffer.writeVarint64(coerceLong(value));
    }

    // optional int32 num_txs = 4;
    var value = message["num_txs"];
    if (value !== undefined) {
      buffer.writeVarint32(32);
      buffer.writeVarint64(value | 0);
    }

    // optional BlockID last_block_id = 5;
    var value = message["last_block_id"];
    if (value !== undefined) {
      buffer.writeVarint32(42);
      var nested = types["encodeBlockID"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional bytes last_commit_hash = 6;
    var value = message["last_commit_hash"];
    if (value !== undefined) {
      buffer.writeVarint32(50);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional bytes data_hash = 7;
    var value = message["data_hash"];
    if (value !== undefined) {
      buffer.writeVarint32(58);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional bytes validators_hash = 8;
    var value = message["validators_hash"];
    if (value !== undefined) {
      buffer.writeVarint32(66);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional bytes app_hash = 9;
    var value = message["app_hash"];
    if (value !== undefined) {
      buffer.writeVarint32(74);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeHeader"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string chain_id = 1;
      case 1:
        message["chain_id"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional int64 height = 2;
      case 2:
        message["height"] = buffer.readVarint64();
        break;

      // optional int64 time = 3;
      case 3:
        message["time"] = buffer.readVarint64();
        break;

      // optional int32 num_txs = 4;
      case 4:
        message["num_txs"] = buffer.readVarint32();
        break;

      // optional BlockID last_block_id = 5;
      case 5:
        var limit = pushTemporaryLength(buffer);
        message["last_block_id"] = types["decodeBlockID"](buffer);
        buffer.limit = limit;
        break;

      // optional bytes last_commit_hash = 6;
      case 6:
        message["last_commit_hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional bytes data_hash = 7;
      case 7:
        message["data_hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional bytes validators_hash = 8;
      case 8:
        message["validators_hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional bytes app_hash = 9;
      case 9:
        message["app_hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeBlockID"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes hash = 1;
    var value = message["hash"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional PartSetHeader parts = 2;
    var value = message["parts"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodePartSetHeader"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    return buffer.flip().toBuffer();
  };

  types["decodeBlockID"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes hash = 1;
      case 1:
        message["hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional PartSetHeader parts = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["parts"] = types["decodePartSetHeader"](buffer);
        buffer.limit = limit;
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodePartSetHeader"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional int32 total = 1;
    var value = message["total"];
    if (value !== undefined) {
      buffer.writeVarint32(8);
      buffer.writeVarint64(value | 0);
    }

    // optional bytes hash = 2;
    var value = message["hash"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    return buffer.flip().toBuffer();
  };

  types["decodePartSetHeader"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 total = 1;
      case 1:
        message["total"] = buffer.readVarint32();
        break;

      // optional bytes hash = 2;
      case 2:
        message["hash"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeValidator"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes pub_key = 1;
    var value = message["pub_key"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional int64 power = 2;
    var value = message["power"];
    if (value !== undefined) {
      buffer.writeVarint32(16);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeValidator"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes pub_key = 1;
      case 1:
        message["pub_key"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional int64 power = 2;
      case 2:
        message["power"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeEvidence"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional bytes pub_key = 1;
    var value = message["pub_key"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      buffer.writeVarint32(value.length), buffer.append(value);
    }

    // optional int64 height = 2;
    var value = message["height"];
    if (value !== undefined) {
      buffer.writeVarint32(16);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeEvidence"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes pub_key = 1;
      case 1:
        message["pub_key"] = buffer.readBytes(buffer.readVarint32()).toBuffer();
        break;

      // optional int64 height = 2;
      case 2:
        message["height"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

  types["encodeKVPair"] = function(message) {
    var buffer = new ByteBuffer(undefined, true);

    // optional string key = 1;
    var value = message["key"];
    if (value !== undefined) {
      buffer.writeVarint32(10);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional Type value_type = 2;
    var value = message["value_type"];
    if (value !== undefined) {
      buffer.writeVarint32(18);
      var nested = types["encodeType"](value);
      buffer.writeVarint32(nested.byteLength), buffer.append(nested);
    }

    // optional string value_string = 3;
    var value = message["value_string"];
    if (value !== undefined) {
      buffer.writeVarint32(26);
      var nested = new ByteBuffer(undefined, true);
      nested.writeUTF8String(value), buffer.writeVarint32(nested.flip().limit), buffer.append(nested);
    }

    // optional int64 value_int = 4;
    var value = message["value_int"];
    if (value !== undefined) {
      buffer.writeVarint32(32);
      buffer.writeVarint64(coerceLong(value));
    }

    return buffer.flip().toBuffer();
  };

  types["decodeKVPair"] = function(buffer) {
    var message = {};

    if (!(buffer instanceof ByteBuffer))
      buffer = new ByteBuffer.fromBinary(buffer, true);

    end_of_message: while (buffer.remaining() > 0) {
      var tag = buffer.readVarint32();

      switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string key = 1;
      case 1:
        message["key"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional Type value_type = 2;
      case 2:
        var limit = pushTemporaryLength(buffer);
        message["value_type"] = types["decodeType"](buffer);
        buffer.limit = limit;
        break;

      // optional string value_string = 3;
      case 3:
        message["value_string"] = buffer.readUTF8String(buffer.readVarint32(), "b");
        break;

      // optional int64 value_int = 4;
      case 4:
        message["value_int"] = buffer.readVarint64();
        break;

      default:
        skipUnknownField(buffer, tag & 7);
      }
    }

    return message;
  };

})();
