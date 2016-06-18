(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":56}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],4:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);

},{}],5:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;

},{}],6:[function(require,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

},{}],7:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for (var n =0; n < 256; n++) {
    c = n;
    for (var k =0; k < 8; k++) {
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable,
      end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;

},{}],8:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg   = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH-1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH-1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length-1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH-1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/

},{"../utils/common":4,"./adler32":5,"./crc32":7,"./messages":12,"./trees":13}],9:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
  var s_window;               /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = s_window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],10:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = {bits: state.lenbits};
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = {bits: state.lenbits};
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = {bits: state.distbits};
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/

},{"../utils/common":4,"./adler32":5,"./crc32":7,"./inffast":9,"./inftrees":11}],11:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
    base = extra = work;    /* dummy value--not used */
    end = 19;

  } else if (type === LENS) {
    base = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":4}],12:[function(require,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

},{}],13:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n*2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n-base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length-1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m*2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
        tree[m*2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n*2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1<<extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1<<extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n*2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n*2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n*2 + 1]/*.Len*/ = 5;
    static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code+LITERALS+1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n*2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node*2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6*2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count-3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count-3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count-11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len+3+7) >>> 3;
    static_lenb = (s.static_len+3+7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;

},{"../utils/common":4}],14:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;

},{}],15:[function(require,module,exports){
(function (process,Buffer){
var msg = require('pako/lib/zlib/messages');
var zstream = require('pako/lib/zlib/zstream');
var zlib_deflate = require('pako/lib/zlib/deflate.js');
var zlib_inflate = require('pako/lib/zlib/inflate.js');
var constants = require('pako/lib/zlib/constants');

for (var key in constants) {
  exports[key] = constants[key];
}

// zlib modes
exports.NONE = 0;
exports.DEFLATE = 1;
exports.INFLATE = 2;
exports.GZIP = 3;
exports.GUNZIP = 4;
exports.DEFLATERAW = 5;
exports.INFLATERAW = 6;
exports.UNZIP = 7;

/**
 * Emulate Node's zlib C++ layer for use by the JS layer in index.js
 */
function Zlib(mode) {
  if (mode < exports.DEFLATE || mode > exports.UNZIP)
    throw new TypeError("Bad argument");
    
  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.windowBits = 0;
  this.level = 0;
  this.memLevel = 0;
  this.strategy = 0;
  this.dictionary = null;
}

Zlib.prototype.init = function(windowBits, level, memLevel, strategy, dictionary) {
  this.windowBits = windowBits;
  this.level = level;
  this.memLevel = memLevel;
  this.strategy = strategy;
  // dictionary not supported.
  
  if (this.mode === exports.GZIP || this.mode === exports.GUNZIP)
    this.windowBits += 16;
    
  if (this.mode === exports.UNZIP)
    this.windowBits += 32;
    
  if (this.mode === exports.DEFLATERAW || this.mode === exports.INFLATERAW)
    this.windowBits = -this.windowBits;
    
  this.strm = new zstream();
  
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.GZIP:
    case exports.DEFLATERAW:
      var status = zlib_deflate.deflateInit2(
        this.strm,
        this.level,
        exports.Z_DEFLATED,
        this.windowBits,
        this.memLevel,
        this.strategy
      );
      break;
    case exports.INFLATE:
    case exports.GUNZIP:
    case exports.INFLATERAW:
    case exports.UNZIP:
      var status  = zlib_inflate.inflateInit2(
        this.strm,
        this.windowBits
      );
      break;
    default:
      throw new Error("Unknown mode " + this.mode);
  }
  
  if (status !== exports.Z_OK) {
    this._error(status);
    return;
  }
  
  this.write_in_progress = false;
  this.init_done = true;
};

Zlib.prototype.params = function() {
  throw new Error("deflateParams Not supported");
};

Zlib.prototype._writeCheck = function() {
  if (!this.init_done)
    throw new Error("write before init");
    
  if (this.mode === exports.NONE)
    throw new Error("already finalized");
    
  if (this.write_in_progress)
    throw new Error("write already in progress");
    
  if (this.pending_close)
    throw new Error("close is pending");
};

Zlib.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {    
  this._writeCheck();
  this.write_in_progress = true;
  
  var self = this;
  process.nextTick(function() {
    self.write_in_progress = false;
    var res = self._write(flush, input, in_off, in_len, out, out_off, out_len);
    self.callback(res[0], res[1]);
    
    if (self.pending_close)
      self.close();
  });
  
  return this;
};

// set method for Node buffers, used by pako
function bufferSet(data, offset) {
  for (var i = 0; i < data.length; i++) {
    this[offset + i] = data[i];
  }
}

Zlib.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this._writeCheck();
  return this._write(flush, input, in_off, in_len, out, out_off, out_len);
};

Zlib.prototype._write = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this.write_in_progress = true;
  
  if (flush !== exports.Z_NO_FLUSH &&
      flush !== exports.Z_PARTIAL_FLUSH &&
      flush !== exports.Z_SYNC_FLUSH &&
      flush !== exports.Z_FULL_FLUSH &&
      flush !== exports.Z_FINISH &&
      flush !== exports.Z_BLOCK) {
    throw new Error("Invalid flush value");
  }
  
  if (input == null) {
    input = new Buffer(0);
    in_len = 0;
    in_off = 0;
  }
  
  if (out._set)
    out.set = out._set;
  else
    out.set = bufferSet;
  
  var strm = this.strm;
  strm.avail_in = in_len;
  strm.input = input;
  strm.next_in = in_off;
  strm.avail_out = out_len;
  strm.output = out;
  strm.next_out = out_off;
  
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.GZIP:
    case exports.DEFLATERAW:
      var status = zlib_deflate.deflate(strm, flush);
      break;
    case exports.UNZIP:
    case exports.INFLATE:
    case exports.GUNZIP:
    case exports.INFLATERAW:
      var status = zlib_inflate.inflate(strm, flush);
      break;
    default:
      throw new Error("Unknown mode " + this.mode);
  }
  
  if (status !== exports.Z_STREAM_END && status !== exports.Z_OK) {
    this._error(status);
  }
  
  this.write_in_progress = false;
  return [strm.avail_in, strm.avail_out];
};

Zlib.prototype.close = function() {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }
  
  this.pending_close = false;
  
  if (this.mode === exports.DEFLATE || this.mode === exports.GZIP || this.mode === exports.DEFLATERAW) {
    zlib_deflate.deflateEnd(this.strm);
  } else {
    zlib_inflate.inflateEnd(this.strm);
  }
  
  this.mode = exports.NONE;
};

Zlib.prototype.reset = function() {
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.DEFLATERAW:
      var status = zlib_deflate.deflateReset(this.strm);
      break;
    case exports.INFLATE:
    case exports.INFLATERAW:
      var status = zlib_inflate.inflateReset(this.strm);
      break;
  }
  
  if (status !== exports.Z_OK) {
    this._error(status);
  }
};

Zlib.prototype._error = function(status) {
  this.onerror(msg[status] + ': ' + this.strm.msg, status);
  
  this.write_in_progress = false;
  if (this.pending_close)
    this.close();
};

exports.Zlib = Zlib;

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":25,"buffer":17,"pako/lib/zlib/constants":6,"pako/lib/zlib/deflate.js":8,"pako/lib/zlib/inflate.js":10,"pako/lib/zlib/messages":12,"pako/lib/zlib/zstream":14}],16:[function(require,module,exports){
(function (process,Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Transform = require('_stream_transform');

var binding = require('./binding');
var util = require('util');
var assert = require('assert').ok;

// zlib doesn't provide these, so kludge them in following the same
// const naming scheme zlib uses.
binding.Z_MIN_WINDOWBITS = 8;
binding.Z_MAX_WINDOWBITS = 15;
binding.Z_DEFAULT_WINDOWBITS = 15;

// fewer than 64 bytes per chunk is stupid.
// technically it could work with as few as 8, but even 64 bytes
// is absurdly low.  Usually a MB or more is best.
binding.Z_MIN_CHUNK = 64;
binding.Z_MAX_CHUNK = Infinity;
binding.Z_DEFAULT_CHUNK = (16 * 1024);

binding.Z_MIN_MEMLEVEL = 1;
binding.Z_MAX_MEMLEVEL = 9;
binding.Z_DEFAULT_MEMLEVEL = 8;

binding.Z_MIN_LEVEL = -1;
binding.Z_MAX_LEVEL = 9;
binding.Z_DEFAULT_LEVEL = binding.Z_DEFAULT_COMPRESSION;

// expose all the zlib constants
Object.keys(binding).forEach(function(k) {
  if (k.match(/^Z/)) exports[k] = binding[k];
});

// translation table for return codes.
exports.codes = {
  Z_OK: binding.Z_OK,
  Z_STREAM_END: binding.Z_STREAM_END,
  Z_NEED_DICT: binding.Z_NEED_DICT,
  Z_ERRNO: binding.Z_ERRNO,
  Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
  Z_DATA_ERROR: binding.Z_DATA_ERROR,
  Z_MEM_ERROR: binding.Z_MEM_ERROR,
  Z_BUF_ERROR: binding.Z_BUF_ERROR,
  Z_VERSION_ERROR: binding.Z_VERSION_ERROR
};

Object.keys(exports.codes).forEach(function(k) {
  exports.codes[exports.codes[k]] = k;
});

exports.Deflate = Deflate;
exports.Inflate = Inflate;
exports.Gzip = Gzip;
exports.Gunzip = Gunzip;
exports.DeflateRaw = DeflateRaw;
exports.InflateRaw = InflateRaw;
exports.Unzip = Unzip;

exports.createDeflate = function(o) {
  return new Deflate(o);
};

exports.createInflate = function(o) {
  return new Inflate(o);
};

exports.createDeflateRaw = function(o) {
  return new DeflateRaw(o);
};

exports.createInflateRaw = function(o) {
  return new InflateRaw(o);
};

exports.createGzip = function(o) {
  return new Gzip(o);
};

exports.createGunzip = function(o) {
  return new Gunzip(o);
};

exports.createUnzip = function(o) {
  return new Unzip(o);
};


// Convenience methods.
// compress/decompress a string or buffer in one step.
exports.deflate = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Deflate(opts), buffer, callback);
};

exports.deflateSync = function(buffer, opts) {
  return zlibBufferSync(new Deflate(opts), buffer);
};

exports.gzip = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gzip(opts), buffer, callback);
};

exports.gzipSync = function(buffer, opts) {
  return zlibBufferSync(new Gzip(opts), buffer);
};

exports.deflateRaw = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new DeflateRaw(opts), buffer, callback);
};

exports.deflateRawSync = function(buffer, opts) {
  return zlibBufferSync(new DeflateRaw(opts), buffer);
};

exports.unzip = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Unzip(opts), buffer, callback);
};

exports.unzipSync = function(buffer, opts) {
  return zlibBufferSync(new Unzip(opts), buffer);
};

exports.inflate = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Inflate(opts), buffer, callback);
};

exports.inflateSync = function(buffer, opts) {
  return zlibBufferSync(new Inflate(opts), buffer);
};

exports.gunzip = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gunzip(opts), buffer, callback);
};

exports.gunzipSync = function(buffer, opts) {
  return zlibBufferSync(new Gunzip(opts), buffer);
};

exports.inflateRaw = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new InflateRaw(opts), buffer, callback);
};

exports.inflateRawSync = function(buffer, opts) {
  return zlibBufferSync(new InflateRaw(opts), buffer);
};

function zlibBuffer(engine, buffer, callback) {
  var buffers = [];
  var nread = 0;

  engine.on('error', onError);
  engine.on('end', onEnd);

  engine.end(buffer);
  flow();

  function flow() {
    var chunk;
    while (null !== (chunk = engine.read())) {
      buffers.push(chunk);
      nread += chunk.length;
    }
    engine.once('readable', flow);
  }

  function onError(err) {
    engine.removeListener('end', onEnd);
    engine.removeListener('readable', flow);
    callback(err);
  }

  function onEnd() {
    var buf = Buffer.concat(buffers, nread);
    buffers = [];
    callback(null, buf);
    engine.close();
  }
}

function zlibBufferSync(engine, buffer) {
  if (typeof buffer === 'string')
    buffer = new Buffer(buffer);
  if (!Buffer.isBuffer(buffer))
    throw new TypeError('Not a string or buffer');

  var flushFlag = binding.Z_FINISH;

  return engine._processChunk(buffer, flushFlag);
}

// generic zlib
// minimal 2-byte header
function Deflate(opts) {
  if (!(this instanceof Deflate)) return new Deflate(opts);
  Zlib.call(this, opts, binding.DEFLATE);
}

function Inflate(opts) {
  if (!(this instanceof Inflate)) return new Inflate(opts);
  Zlib.call(this, opts, binding.INFLATE);
}



// gzip - bigger header, same deflate compression
function Gzip(opts) {
  if (!(this instanceof Gzip)) return new Gzip(opts);
  Zlib.call(this, opts, binding.GZIP);
}

function Gunzip(opts) {
  if (!(this instanceof Gunzip)) return new Gunzip(opts);
  Zlib.call(this, opts, binding.GUNZIP);
}



// raw - no header
function DeflateRaw(opts) {
  if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
  Zlib.call(this, opts, binding.DEFLATERAW);
}

function InflateRaw(opts) {
  if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
  Zlib.call(this, opts, binding.INFLATERAW);
}


// auto-detect header.
function Unzip(opts) {
  if (!(this instanceof Unzip)) return new Unzip(opts);
  Zlib.call(this, opts, binding.UNZIP);
}


// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.

function Zlib(opts, mode) {
  this._opts = opts = opts || {};
  this._chunkSize = opts.chunkSize || exports.Z_DEFAULT_CHUNK;

  Transform.call(this, opts);

  if (opts.flush) {
    if (opts.flush !== binding.Z_NO_FLUSH &&
        opts.flush !== binding.Z_PARTIAL_FLUSH &&
        opts.flush !== binding.Z_SYNC_FLUSH &&
        opts.flush !== binding.Z_FULL_FLUSH &&
        opts.flush !== binding.Z_FINISH &&
        opts.flush !== binding.Z_BLOCK) {
      throw new Error('Invalid flush flag: ' + opts.flush);
    }
  }
  this._flushFlag = opts.flush || binding.Z_NO_FLUSH;

  if (opts.chunkSize) {
    if (opts.chunkSize < exports.Z_MIN_CHUNK ||
        opts.chunkSize > exports.Z_MAX_CHUNK) {
      throw new Error('Invalid chunk size: ' + opts.chunkSize);
    }
  }

  if (opts.windowBits) {
    if (opts.windowBits < exports.Z_MIN_WINDOWBITS ||
        opts.windowBits > exports.Z_MAX_WINDOWBITS) {
      throw new Error('Invalid windowBits: ' + opts.windowBits);
    }
  }

  if (opts.level) {
    if (opts.level < exports.Z_MIN_LEVEL ||
        opts.level > exports.Z_MAX_LEVEL) {
      throw new Error('Invalid compression level: ' + opts.level);
    }
  }

  if (opts.memLevel) {
    if (opts.memLevel < exports.Z_MIN_MEMLEVEL ||
        opts.memLevel > exports.Z_MAX_MEMLEVEL) {
      throw new Error('Invalid memLevel: ' + opts.memLevel);
    }
  }

  if (opts.strategy) {
    if (opts.strategy != exports.Z_FILTERED &&
        opts.strategy != exports.Z_HUFFMAN_ONLY &&
        opts.strategy != exports.Z_RLE &&
        opts.strategy != exports.Z_FIXED &&
        opts.strategy != exports.Z_DEFAULT_STRATEGY) {
      throw new Error('Invalid strategy: ' + opts.strategy);
    }
  }

  if (opts.dictionary) {
    if (!Buffer.isBuffer(opts.dictionary)) {
      throw new Error('Invalid dictionary: it should be a Buffer instance');
    }
  }

  this._binding = new binding.Zlib(mode);

  var self = this;
  this._hadError = false;
  this._binding.onerror = function(message, errno) {
    // there is no way to cleanly recover.
    // continuing only obscures problems.
    self._binding = null;
    self._hadError = true;

    var error = new Error(message);
    error.errno = errno;
    error.code = exports.codes[errno];
    self.emit('error', error);
  };

  var level = exports.Z_DEFAULT_COMPRESSION;
  if (typeof opts.level === 'number') level = opts.level;

  var strategy = exports.Z_DEFAULT_STRATEGY;
  if (typeof opts.strategy === 'number') strategy = opts.strategy;

  this._binding.init(opts.windowBits || exports.Z_DEFAULT_WINDOWBITS,
                     level,
                     opts.memLevel || exports.Z_DEFAULT_MEMLEVEL,
                     strategy,
                     opts.dictionary);

  this._buffer = new Buffer(this._chunkSize);
  this._offset = 0;
  this._closed = false;
  this._level = level;
  this._strategy = strategy;

  this.once('end', this.close);
}

util.inherits(Zlib, Transform);

Zlib.prototype.params = function(level, strategy, callback) {
  if (level < exports.Z_MIN_LEVEL ||
      level > exports.Z_MAX_LEVEL) {
    throw new RangeError('Invalid compression level: ' + level);
  }
  if (strategy != exports.Z_FILTERED &&
      strategy != exports.Z_HUFFMAN_ONLY &&
      strategy != exports.Z_RLE &&
      strategy != exports.Z_FIXED &&
      strategy != exports.Z_DEFAULT_STRATEGY) {
    throw new TypeError('Invalid strategy: ' + strategy);
  }

  if (this._level !== level || this._strategy !== strategy) {
    var self = this;
    this.flush(binding.Z_SYNC_FLUSH, function() {
      self._binding.params(level, strategy);
      if (!self._hadError) {
        self._level = level;
        self._strategy = strategy;
        if (callback) callback();
      }
    });
  } else {
    process.nextTick(callback);
  }
};

Zlib.prototype.reset = function() {
  return this._binding.reset();
};

// This is the _flush function called by the transform class,
// internally, when the last chunk has been written.
Zlib.prototype._flush = function(callback) {
  this._transform(new Buffer(0), '', callback);
};

Zlib.prototype.flush = function(kind, callback) {
  var ws = this._writableState;

  if (typeof kind === 'function' || (kind === void 0 && !callback)) {
    callback = kind;
    kind = binding.Z_FULL_FLUSH;
  }

  if (ws.ended) {
    if (callback)
      process.nextTick(callback);
  } else if (ws.ending) {
    if (callback)
      this.once('end', callback);
  } else if (ws.needDrain) {
    var self = this;
    this.once('drain', function() {
      self.flush(callback);
    });
  } else {
    this._flushFlag = kind;
    this.write(new Buffer(0), '', callback);
  }
};

Zlib.prototype.close = function(callback) {
  if (callback)
    process.nextTick(callback);

  if (this._closed)
    return;

  this._closed = true;

  this._binding.close();

  var self = this;
  process.nextTick(function() {
    self.emit('close');
  });
};

Zlib.prototype._transform = function(chunk, encoding, cb) {
  var flushFlag;
  var ws = this._writableState;
  var ending = ws.ending || ws.ended;
  var last = ending && (!chunk || ws.length === chunk.length);

  if (!chunk === null && !Buffer.isBuffer(chunk))
    return cb(new Error('invalid input'));

  // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag.
  // If it's explicitly flushing at some other time, then we use
  // Z_FULL_FLUSH. Otherwise, use Z_NO_FLUSH for maximum compression
  // goodness.
  if (last)
    flushFlag = binding.Z_FINISH;
  else {
    flushFlag = this._flushFlag;
    // once we've flushed the last of the queue, stop flushing and
    // go back to the normal behavior.
    if (chunk.length >= ws.length) {
      this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
    }
  }

  var self = this;
  this._processChunk(chunk, flushFlag, cb);
};

Zlib.prototype._processChunk = function(chunk, flushFlag, cb) {
  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var inOff = 0;

  var self = this;

  var async = typeof cb === 'function';

  if (!async) {
    var buffers = [];
    var nread = 0;

    var error;
    this.on('error', function(er) {
      error = er;
    });

    do {
      var res = this._binding.writeSync(flushFlag,
                                        chunk, // in
                                        inOff, // in_off
                                        availInBefore, // in_len
                                        this._buffer, // out
                                        this._offset, //out_off
                                        availOutBefore); // out_len
    } while (!this._hadError && callback(res[0], res[1]));

    if (this._hadError) {
      throw error;
    }

    var buf = Buffer.concat(buffers, nread);
    this.close();

    return buf;
  }

  var req = this._binding.write(flushFlag,
                                chunk, // in
                                inOff, // in_off
                                availInBefore, // in_len
                                this._buffer, // out
                                this._offset, //out_off
                                availOutBefore); // out_len

  req.buffer = chunk;
  req.callback = callback;

  function callback(availInAfter, availOutAfter) {
    if (self._hadError)
      return;

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, 'have should not go down');

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;
      // serve some output to the consumer.
      if (async) {
        self.push(out);
      } else {
        buffers.push(out);
        nread += out.length;
      }
    }

    // exhausted the output buffer, or used all the input create a new one.
    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = new Buffer(self._chunkSize);
    }

    if (availOutAfter === 0) {
      // Not actually done.  Need to reprocess.
      // Also, update the availInBefore to the availInAfter value,
      // so that if we have to hit it a third (fourth, etc.) time,
      // it'll have the correct byte counts.
      inOff += (availInBefore - availInAfter);
      availInBefore = availInAfter;

      if (!async)
        return true;

      var newReq = self._binding.write(flushFlag,
                                       chunk,
                                       inOff,
                                       availInBefore,
                                       self._buffer,
                                       self._offset,
                                       self._chunkSize);
      newReq.callback = callback; // this same function
      newReq.buffer = chunk;
      return;
    }

    if (!async)
      return false;

    // finished with the chunk.
    cb();
  }
};

util.inherits(Deflate, Zlib);
util.inherits(Inflate, Zlib);
util.inherits(Gzip, Zlib);
util.inherits(Gunzip, Zlib);
util.inherits(DeflateRaw, Zlib);
util.inherits(InflateRaw, Zlib);
util.inherits(Unzip, Zlib);

}).call(this,require('_process'),require("buffer").Buffer)
},{"./binding":15,"_process":25,"_stream_transform":43,"assert":2,"buffer":17,"util":56}],17:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":18,"ieee754":19,"isarray":20}],18:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],19:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],20:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],21:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],22:[function(require,module,exports){
var http = require('http');

var https = module.exports;

for (var key in http) {
    if (http.hasOwnProperty(key)) https[key] = http[key];
};

https.request = function (params, cb) {
    if (!params) params = {};
    params.scheme = 'https';
    params.protocol = 'https:';
    return http.request.call(this, params, cb);
}

},{"http":46}],23:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],24:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],25:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],26:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],28:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],29:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":27,"./encode":28}],30:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":31}],31:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":33,"./_stream_writable":35,"core-util-is":37,"inherits":23,"process-nextick-args":39}],32:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":34,"core-util-is":37,"inherits":23}],33:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

var hasPrependListener = typeof EE.prototype.prependListener === 'function';

function prependListener(emitter, event, fn) {
  if (hasPrependListener) return emitter.prependListener(event, fn);

  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS. This is here
  // only because this code needs to continue to work with older versions
  // of Node.js that do not include the prependListener() method. The goal
  // is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

var Duplex;
function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

var Duplex;
function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = bufferShim.from(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var _e = new Error('stream.unshift() after end event');
      stream.emit('error', _e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended) return 0;

  if (state.objectMode) return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
  }

  if (n <= 0) return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended) state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && !this._readableState.endEmitted) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0) return null;

  if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode) ret = '';else ret = bufferShim.allocUnsafe(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var _buf = list[0];
        var cpy = Math.min(n - c, _buf.length);

        if (stringMode) ret += _buf.slice(0, cpy);else _buf.copy(ret, c, 0, cpy);

        if (cpy < _buf.length) list[0] = _buf.slice(cpy);else list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'))
},{"./_stream_duplex":31,"_process":25,"buffer":17,"buffer-shims":36,"core-util-is":37,"events":21,"inherits":23,"isarray":38,"process-nextick-args":39,"string_decoder/":52,"util":3}],34:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('Not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":31,"core-util-is":37,"inherits":23}],35:[function(require,module,exports){
(function (process){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

var Duplex;
function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

var Duplex;
function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;
  // Always throw error if a null is written
  // if we are not in object mode then throw
  // if it is not a buffer, string, or undefined.
  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = bufferShim.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
}).call(this,require('_process'))
},{"./_stream_duplex":31,"_process":25,"buffer":17,"buffer-shims":36,"core-util-is":37,"events":21,"inherits":23,"process-nextick-args":39,"util-deprecate":40}],36:[function(require,module,exports){
(function (global){
'use strict';

var buffer = require('buffer');
var Buffer = buffer.Buffer;
var SlowBuffer = buffer.SlowBuffer;
var MAX_LEN = buffer.kMaxLength || 2147483647;
exports.alloc = function alloc(size, fill, encoding) {
  if (typeof Buffer.alloc === 'function') {
    return Buffer.alloc(size, fill, encoding);
  }
  if (typeof encoding === 'number') {
    throw new TypeError('encoding must not be number');
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  var enc = encoding;
  var _fill = fill;
  if (_fill === undefined) {
    enc = undefined;
    _fill = 0;
  }
  var buf = new Buffer(size);
  if (typeof _fill === 'string') {
    var fillBuf = new Buffer(_fill, enc);
    var flen = fillBuf.length;
    var i = -1;
    while (++i < size) {
      buf[i] = fillBuf[i % flen];
    }
  } else {
    buf.fill(_fill);
  }
  return buf;
}
exports.allocUnsafe = function allocUnsafe(size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    return Buffer.allocUnsafe(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new Buffer(size);
}
exports.from = function from(value, encodingOrOffset, length) {
  if (typeof Buffer.from === 'function' && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
    return Buffer.from(value, encodingOrOffset, length);
  }
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number');
  }
  if (typeof value === 'string') {
    return new Buffer(value, encodingOrOffset);
  }
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    var offset = encodingOrOffset;
    if (arguments.length === 1) {
      return new Buffer(value);
    }
    if (typeof offset === 'undefined') {
      offset = 0;
    }
    var len = length;
    if (typeof len === 'undefined') {
      len = value.byteLength - offset;
    }
    if (offset >= value.byteLength) {
      throw new RangeError('\'offset\' is out of bounds');
    }
    if (len > value.byteLength - offset) {
      throw new RangeError('\'length\' is out of bounds');
    }
    return new Buffer(value.slice(offset, offset + len));
  }
  if (Buffer.isBuffer(value)) {
    var out = new Buffer(value.length);
    value.copy(out, 0, 0, value.length);
    return out;
  }
  if (value) {
    if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && value.buffer instanceof ArrayBuffer) || 'length' in value) {
      return new Buffer(value);
    }
    if (value.type === 'Buffer' && Array.isArray(value.data)) {
      return new Buffer(value.data);
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ' + 'ArrayBuffer, Array, or array-like object.');
}
exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
  if (typeof Buffer.allocUnsafeSlow === 'function') {
    return Buffer.allocUnsafeSlow(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size >= MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new SlowBuffer(size);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"buffer":17}],37:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../insert-module-globals/node_modules/is-buffer/index.js")})
},{"../../../../insert-module-globals/node_modules/is-buffer/index.js":24}],38:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],39:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

}).call(this,require('_process'))
},{"_process":25}],40:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],41:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":32}],42:[function(require,module,exports){
(function (process){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

if (!process.browser && process.env.READABLE_STREAM === 'disable' && Stream) {
  module.exports = Stream;
}

}).call(this,require('_process'))
},{"./lib/_stream_duplex.js":31,"./lib/_stream_passthrough.js":32,"./lib/_stream_readable.js":33,"./lib/_stream_transform.js":34,"./lib/_stream_writable.js":35,"_process":25}],43:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":34}],44:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":35}],45:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":21,"inherits":23,"readable-stream/duplex.js":30,"readable-stream/passthrough.js":41,"readable-stream/readable.js":42,"readable-stream/transform.js":43,"readable-stream/writable.js":44}],46:[function(require,module,exports){
(function (global){
var ClientRequest = require('./lib/request')
var extend = require('xtend')
var statusCodes = require('builtin-status-codes')
var url = require('url')

var http = exports

http.request = function (opts, cb) {
	if (typeof opts === 'string')
		opts = url.parse(opts)
	else
		opts = extend(opts)

	// Normally, the page is loaded from http or https, so not specifying a protocol
	// will result in a (valid) protocol-relative url. However, this won't work if
	// the protocol is something else, like 'file:'
	var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? 'http:' : ''

	var protocol = opts.protocol || defaultProtocol
	var host = opts.hostname || opts.host
	var port = opts.port
	var path = opts.path || '/'

	// Necessary for IPv6 addresses
	if (host && host.indexOf(':') !== -1)
		host = '[' + host + ']'

	// This may be a relative url. The browser should always be able to interpret it correctly.
	opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
	opts.method = (opts.method || 'GET').toUpperCase()
	opts.headers = opts.headers || {}

	// Also valid opts.auth, opts.mode

	var req = new ClientRequest(opts)
	if (cb)
		req.on('response', cb)
	return req
}

http.get = function get (opts, cb) {
	var req = http.request(opts, cb)
	req.end()
	return req
}

http.Agent = function () {}
http.Agent.defaultMaxSockets = 4

http.STATUS_CODES = statusCodes

http.METHODS = [
	'CHECKOUT',
	'CONNECT',
	'COPY',
	'DELETE',
	'GET',
	'HEAD',
	'LOCK',
	'M-SEARCH',
	'MERGE',
	'MKACTIVITY',
	'MKCOL',
	'MOVE',
	'NOTIFY',
	'OPTIONS',
	'PATCH',
	'POST',
	'PROPFIND',
	'PROPPATCH',
	'PURGE',
	'PUT',
	'REPORT',
	'SEARCH',
	'SUBSCRIBE',
	'TRACE',
	'UNLOCK',
	'UNSUBSCRIBE'
]
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/request":48,"builtin-status-codes":50,"url":53,"xtend":57}],47:[function(require,module,exports){
(function (global){
exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableByteStream)

exports.blobConstructor = false
try {
	new Blob([new ArrayBuffer(1)])
	exports.blobConstructor = true
} catch (e) {}

var xhr = new global.XMLHttpRequest()
// If location.host is empty, e.g. if this page/worker was loaded
// from a Blob, then use example.com to avoid an error
xhr.open('GET', global.location.host ? '/' : 'https://example.com')

function checkTypeSupport (type) {
	try {
		xhr.responseType = type
		return xhr.responseType === type
	} catch (e) {}
	return false
}

// For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
// Safari 7.1 appears to have fixed this bug.
var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined'
var haveSlice = haveArrayBuffer && isFunction(global.ArrayBuffer.prototype.slice)

exports.arraybuffer = haveArrayBuffer && checkTypeSupport('arraybuffer')
// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream = !exports.fetch && haveSlice && checkTypeSupport('ms-stream')
exports.mozchunkedarraybuffer = !exports.fetch && haveArrayBuffer &&
	checkTypeSupport('moz-chunked-arraybuffer')
exports.overrideMimeType = isFunction(xhr.overrideMimeType)
exports.vbArray = isFunction(global.VBArray)

function isFunction (value) {
  return typeof value === 'function'
}

xhr = null // Help gc

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var response = require('./response')
var stream = require('readable-stream')
var toArrayBuffer = require('to-arraybuffer')

var IncomingMessage = response.IncomingMessage
var rStates = response.readyStates

function decideMode (preferBinary) {
	if (capability.fetch) {
		return 'fetch'
	} else if (capability.mozchunkedarraybuffer) {
		return 'moz-chunked-arraybuffer'
	} else if (capability.msstream) {
		return 'ms-stream'
	} else if (capability.arraybuffer && preferBinary) {
		return 'arraybuffer'
	} else if (capability.vbArray && preferBinary) {
		return 'text:vbarray'
	} else {
		return 'text'
	}
}

var ClientRequest = module.exports = function (opts) {
	var self = this
	stream.Writable.call(self)

	self._opts = opts
	self._body = []
	self._headers = {}
	if (opts.auth)
		self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'))
	Object.keys(opts.headers).forEach(function (name) {
		self.setHeader(name, opts.headers[name])
	})

	var preferBinary
	if (opts.mode === 'prefer-streaming') {
		// If streaming is a high priority but binary compatibility and
		// the accuracy of the 'content-type' header aren't
		preferBinary = false
	} else if (opts.mode === 'allow-wrong-content-type') {
		// If streaming is more important than preserving the 'content-type' header
		preferBinary = !capability.overrideMimeType
	} else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
		// Use binary if text streaming may corrupt data or the content-type header, or for speed
		preferBinary = true
	} else {
		throw new Error('Invalid value for opts.mode')
	}
	self._mode = decideMode(preferBinary)

	self.on('finish', function () {
		self._onFinish()
	})
}

inherits(ClientRequest, stream.Writable)

ClientRequest.prototype.setHeader = function (name, value) {
	var self = this
	var lowerName = name.toLowerCase()
	// This check is not necessary, but it prevents warnings from browsers about setting unsafe
	// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
	// http-browserify did it, so I will too.
	if (unsafeHeaders.indexOf(lowerName) !== -1)
		return

	self._headers[lowerName] = {
		name: name,
		value: value
	}
}

ClientRequest.prototype.getHeader = function (name) {
	var self = this
	return self._headers[name.toLowerCase()].value
}

ClientRequest.prototype.removeHeader = function (name) {
	var self = this
	delete self._headers[name.toLowerCase()]
}

ClientRequest.prototype._onFinish = function () {
	var self = this

	if (self._destroyed)
		return
	var opts = self._opts

	var headersObj = self._headers
	var body
	if (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH') {
		if (capability.blobConstructor) {
			body = new global.Blob(self._body.map(function (buffer) {
				return toArrayBuffer(buffer)
			}), {
				type: (headersObj['content-type'] || {}).value || ''
			})
		} else {
			// get utf8 string
			body = Buffer.concat(self._body).toString()
		}
	}

	if (self._mode === 'fetch') {
		var headers = Object.keys(headersObj).map(function (name) {
			return [headersObj[name].name, headersObj[name].value]
		})

		global.fetch(self._opts.url, {
			method: self._opts.method,
			headers: headers,
			body: body,
			mode: 'cors',
			credentials: opts.withCredentials ? 'include' : 'same-origin'
		}).then(function (response) {
			self._fetchResponse = response
			self._connect()
		}, function (reason) {
			self.emit('error', reason)
		})
	} else {
		var xhr = self._xhr = new global.XMLHttpRequest()
		try {
			xhr.open(self._opts.method, self._opts.url, true)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}

		// Can't set responseType on really old browsers
		if ('responseType' in xhr)
			xhr.responseType = self._mode.split(':')[0]

		if ('withCredentials' in xhr)
			xhr.withCredentials = !!opts.withCredentials

		if (self._mode === 'text' && 'overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain; charset=x-user-defined')

		Object.keys(headersObj).forEach(function (name) {
			xhr.setRequestHeader(headersObj[name].name, headersObj[name].value)
		})

		self._response = null
		xhr.onreadystatechange = function () {
			switch (xhr.readyState) {
				case rStates.LOADING:
				case rStates.DONE:
					self._onXHRProgress()
					break
			}
		}
		// Necessary for streaming in Firefox, since xhr.response is ONLY defined
		// in onprogress, not in onreadystatechange with xhr.readyState = 3
		if (self._mode === 'moz-chunked-arraybuffer') {
			xhr.onprogress = function () {
				self._onXHRProgress()
			}
		}

		xhr.onerror = function () {
			if (self._destroyed)
				return
			self.emit('error', new Error('XHR error'))
		}

		try {
			xhr.send(body)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}
	}
}

/**
 * Checks if xhr.status is readable and non-zero, indicating no error.
 * Even though the spec says it should be available in readyState 3,
 * accessing it throws an exception in IE8
 */
function statusValid (xhr) {
	try {
		var status = xhr.status
		return (status !== null && status !== 0)
	} catch (e) {
		return false
	}
}

ClientRequest.prototype._onXHRProgress = function () {
	var self = this

	if (!statusValid(self._xhr) || self._destroyed)
		return

	if (!self._response)
		self._connect()

	self._response._onXHRProgress()
}

ClientRequest.prototype._connect = function () {
	var self = this

	if (self._destroyed)
		return

	self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode)
	self.emit('response', self._response)
}

ClientRequest.prototype._write = function (chunk, encoding, cb) {
	var self = this

	self._body.push(chunk)
	cb()
}

ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
	var self = this
	self._destroyed = true
	if (self._response)
		self._response._destroyed = true
	if (self._xhr)
		self._xhr.abort()
	// Currently, there isn't a way to truly abort a fetch.
	// If you like bikeshedding, see https://github.com/whatwg/fetch/issues/27
}

ClientRequest.prototype.end = function (data, encoding, cb) {
	var self = this
	if (typeof data === 'function') {
		cb = data
		data = undefined
	}

	stream.Writable.prototype.end.call(self, data, encoding, cb)
}

ClientRequest.prototype.flushHeaders = function () {}
ClientRequest.prototype.setTimeout = function () {}
ClientRequest.prototype.setNoDelay = function () {}
ClientRequest.prototype.setSocketKeepAlive = function () {}

// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders = [
	'accept-charset',
	'accept-encoding',
	'access-control-request-headers',
	'access-control-request-method',
	'connection',
	'content-length',
	'cookie',
	'cookie2',
	'date',
	'dnt',
	'expect',
	'host',
	'keep-alive',
	'origin',
	'referer',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'user-agent',
	'via'
]

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":47,"./response":49,"_process":25,"buffer":17,"inherits":23,"readable-stream":42,"to-arraybuffer":51}],49:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var stream = require('readable-stream')

var rStates = exports.readyStates = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
}

var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode) {
	var self = this
	stream.Readable.call(self)

	self._mode = mode
	self.headers = {}
	self.rawHeaders = []
	self.trailers = {}
	self.rawTrailers = []

	// Fake the 'close' event, but only once 'end' fires
	self.on('end', function () {
		// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
		process.nextTick(function () {
			self.emit('close')
		})
	})

	if (mode === 'fetch') {
		self._fetchResponse = response

		self.url = response.url
		self.statusCode = response.status
		self.statusMessage = response.statusText
		// backwards compatible version of for (<item> of <iterable>):
		// for (var <item>,_i,_it = <iterable>[Symbol.iterator](); <item> = (_i = _it.next()).value,!_i.done;)
		for (var header, _i, _it = response.headers[Symbol.iterator](); header = (_i = _it.next()).value, !_i.done;) {
			self.headers[header[0].toLowerCase()] = header[1]
			self.rawHeaders.push(header[0], header[1])
		}

		// TODO: this doesn't respect backpressure. Once WritableStream is available, this can be fixed
		var reader = response.body.getReader()
		function read () {
			reader.read().then(function (result) {
				if (self._destroyed)
					return
				if (result.done) {
					self.push(null)
					return
				}
				self.push(new Buffer(result.value))
				read()
			})
		}
		read()

	} else {
		self._xhr = xhr
		self._pos = 0

		self.url = xhr.responseURL
		self.statusCode = xhr.status
		self.statusMessage = xhr.statusText
		var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
		headers.forEach(function (header) {
			var matches = header.match(/^([^:]+):\s*(.*)/)
			if (matches) {
				var key = matches[1].toLowerCase()
				if (key === 'set-cookie') {
					if (self.headers[key] === undefined) {
						self.headers[key] = []
					}
					self.headers[key].push(matches[2])
				} else if (self.headers[key] !== undefined) {
					self.headers[key] += ', ' + matches[2]
				} else {
					self.headers[key] = matches[2]
				}
				self.rawHeaders.push(matches[1], matches[2])
			}
		})

		self._charset = 'x-user-defined'
		if (!capability.overrideMimeType) {
			var mimeType = self.rawHeaders['mime-type']
			if (mimeType) {
				var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
				if (charsetMatch) {
					self._charset = charsetMatch[1].toLowerCase()
				}
			}
			if (!self._charset)
				self._charset = 'utf-8' // best guess
		}
	}
}

inherits(IncomingMessage, stream.Readable)

IncomingMessage.prototype._read = function () {}

IncomingMessage.prototype._onXHRProgress = function () {
	var self = this

	var xhr = self._xhr

	var response = null
	switch (self._mode) {
		case 'text:vbarray': // For IE9
			if (xhr.readyState !== rStates.DONE)
				break
			try {
				// This fails in IE8
				response = new global.VBArray(xhr.responseBody).toArray()
			} catch (e) {}
			if (response !== null) {
				self.push(new Buffer(response))
				break
			}
			// Falls through in IE8	
		case 'text':
			try { // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
				response = xhr.responseText
			} catch (e) {
				self._mode = 'text:vbarray'
				break
			}
			if (response.length > self._pos) {
				var newData = response.substr(self._pos)
				if (self._charset === 'x-user-defined') {
					var buffer = new Buffer(newData.length)
					for (var i = 0; i < newData.length; i++)
						buffer[i] = newData.charCodeAt(i) & 0xff

					self.push(buffer)
				} else {
					self.push(newData, self._charset)
				}
				self._pos = response.length
			}
			break
		case 'arraybuffer':
			if (xhr.readyState !== rStates.DONE)
				break
			response = xhr.response
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'moz-chunked-arraybuffer': // take whole
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING || !response)
				break
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'ms-stream':
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING)
				break
			var reader = new global.MSStreamReader()
			reader.onprogress = function () {
				if (reader.result.byteLength > self._pos) {
					self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))))
					self._pos = reader.result.byteLength
				}
			}
			reader.onload = function () {
				self.push(null)
			}
			// reader.onerror = ??? // TODO: this
			reader.readAsArrayBuffer(response)
			break
	}

	// The ms-stream case handles end separately in reader.onload()
	if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
		self.push(null)
	}
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":47,"_process":25,"buffer":17,"inherits":23,"readable-stream":42}],50:[function(require,module,exports){
module.exports = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
}

},{}],51:[function(require,module,exports){
var Buffer = require('buffer').Buffer

module.exports = function (buf) {
	// If the buffer is backed by a Uint8Array, a faster version will work
	if (buf instanceof Uint8Array) {
		// If the buffer isn't a subarray, return the underlying ArrayBuffer
		if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
			return buf.buffer
		} else if (typeof buf.buffer.slice === 'function') {
			// Otherwise we need to get a proper copy
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
		}
	}

	if (Buffer.isBuffer(buf)) {
		// This is the slow version that will work with any Buffer
		// implementation (even in old browsers)
		var arrayCopy = new Uint8Array(buf.length)
		var len = buf.length
		for (var i = 0; i < len; i++) {
			arrayCopy[i] = buf[i]
		}
		return arrayCopy.buffer
	} else {
		throw new Error('Argument must be a Buffer')
	}
}

},{"buffer":17}],52:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":17}],53:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":54,"punycode":26,"querystring":29}],54:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],55:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],56:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":55,"_process":25,"inherits":23}],57:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],58:[function(require,module,exports){
$(document).ready(function(){
    var SpotifyWebApi = require('spotify-web-api-node');
    var spotifyApi = new SpotifyWebApi();
    var myData;
    var j;
    $("#test").on("click", function(){
        for (var j = 0; j < 20; j++) {
        spotifyApi.searchTracks(document.getElementById('filename').value)
        .then(function (data) {
                while (j < 20){
                $("#results").after("<header class='songLink'>" + data.body.tracks.items[j].artists[0].name + " ////////// " + data.body.tracks.items[j].name + "</header><br/>");
                $(".songLink").eq(j).attr("id", "songLink" + j);
                                $(".songLink").eq(j).attr("name", baseURL + userID + "/playlists/" + Snapster + "/tracks?position=0&uris=spotify%3Atrack%3A" + data.body.tracks.items[j].id);
                $('#songLink' + j).on("click", function () {
                    $.ajax({
                        type: "POST",
                        url: $(this).attr('name'),
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        dataType: "json",
                        data: "formdata",
                        success: function (dataFirst) {
                            console.log(Snapster);
                        }
                    });
                });
                        }
            })
        , function (err) {
        console.error(err);
    };
        }
        
        });
    });

},{"spotify-web-api-node":100}],59:[function(require,module,exports){
'use strict';

var asap = require('asap')

module.exports = Promise
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new Promise(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":61}],60:[function(require,module,exports){
'use strict';

//This file contains then/promise specific extensions to the core promise API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Object.create(Promise.prototype)

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.resolve = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}

Promise.from = Promise.cast = function (value) {
  var err = new Error('Promise.from and Promise.cast are deprecated, use Promise.resolve instead')
  err.name = 'Warning'
  console.warn(err.stack)
  return Promise.resolve(value)
}

Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    try {
      return fn.apply(this, arguments).nodeify(callback)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback(ex)
        })
      }
    }
  }
}

Promise.all = function () {
  var calledWithArray = arguments.length === 1 && Array.isArray(arguments[0])
  var args = Array.prototype.slice.call(calledWithArray ? arguments[0] : arguments)

  if (!calledWithArray) {
    var err = new Error('Promise.all should be called with a single array, calling it with multiple arguments is deprecated')
    err.name = 'Warning'
    console.warn(err.stack)
  }

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    })
  });
}

/* Prototype Methods */

Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}

Promise.prototype.nodeify = function (callback) {
  if (typeof callback != 'function') return this

  this.then(function (value) {
    asap(function () {
      callback(null, value)
    })
  }, function (err) {
    asap(function () {
      callback(err)
    })
  })
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
}

},{"./core.js":59,"asap":61}],61:[function(require,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require('_process'))
},{"_process":25}],62:[function(require,module,exports){
var fs = require('fs');
var sys = require('util')
exports.defaultBoundary = '48940923NODERESLTER3890457293';


// This little object allows us hijack the write method via duck-typing
// and write to strings or regular streams that support the write method.
function Stream(stream) {
	//If the user pases a string for stream,we initalize one to write to
	if (this._isString(stream)) {
		this.string = "";
	}
	this.stream = stream;
	
}

Stream.prototype = {
  //write to an internal String or to the Stream
  write: function(data) {
	if (this.string != undefined) {
		this.string += data;
	} else {
		this.stream.write(data, "binary");
	}
  },

  //stolen from underscore.js
  _isString: function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  }
}

function File(path, filename, fileSize, encoding, contentType) {
  this.path = path;
  this.filename = filename || this._basename(path);
  this.fileSize = fileSize;
  this.encoding = encoding || "binary";
  this.contentType = contentType || 'application/octet-stream';
}

File.prototype = {
  _basename: function(path) {
    var parts = path.split(/\/|\\/);
    return parts[parts.length - 1];
  }
};

function Data(filename, contentType, data) {
  this.filename = filename;
  this.contentType = contentType || 'application/octet-stream';
  this.data = data;
}

function Part(name, value, boundary) {
  this.name = name;
  this.value = value;
  this.boundary = boundary;
}


Part.prototype = {
	
  //returns the Content-Disposition header		
  header: function() {
	  var header;
	  
    if (this.value.data) {
	    header = "Content-Disposition: form-data; name=\"" + this.name + 
  	            "\"; filename=\"" + this.value.filename + "\"\r\n" +
  	            "Content-Length: " + this.value.data.length + "\r\n" +	
  	            "Content-Type: " + this.value.contentType;
 	  } else if (this.value instanceof File) {
  	  header = "Content-Disposition: form-data; name=\"" + this.name + 
  	            "\"; filename=\"" + this.value.filename + "\"\r\n" +
  	            "Content-Length: " + this.value.fileSize + "\r\n" +	
  	            "Content-Type: " + this.value.contentType;	
  	} else {
      header = "Content-Disposition: form-data; name=\"" + this.name + "\"";
  	}
  	
	  return "--" + this.boundary + "\r\n" + header + "\r\n\r\n";
  },

  //calculates the size of the Part
  sizeOf: function() {
	  var valueSize;
  	if (this.value instanceof File) {
  	  valueSize = this.value.fileSize;
  	} else if (this.value.data) {
  	  valueSize = this.value.data.length;
        } else if (typeof this.value === 'number') {
          valueSize = this.value.toString().length;
  	} else {
  	  valueSize = this.value.length;
  	}
  	return valueSize + this.header().length + 2; 
  },

  // Writes the Part out to a writable stream that supports the write(data) method
  // You can also pass in a String and a String will be returned to the callback
  // with the whole Part
  // Calls the callback when complete
  write: function(stream, callback) {
	
    var self = this;
	
	  //first write the Content-Disposition
	  stream.write(this.header());
	
  	//Now write out the body of the Part
    if (this.value instanceof File) {
  	  fs.open(this.value.path, "r", 0666, function (err, fd) { 
    	  if (err) throw err; 
    	  
  		  var position = 0;
  		  
  	    (function reader () {
  	      fs.read(fd, 1024 * 4, position, "binary", function (er, chunk) {
  	        if (er) callback(err);
  	        stream.write(chunk); 
  	        position += 1024 * 4;
  	        if (chunk) reader();
  	        else {
  			      stream.write("\r\n")
      			  callback();
      			  fs.close(fd);
      			}
  	      }); 
  	    })(); // reader() 
  	  });
     } else if (this.value instanceof Data) {
  	  stream.write(this.value.data);
  	  stream.write("\r\n");
  	  callback();
     } else {
  	  stream.write(this.value + "\r\n");
  	  callback();
  	}
  }
}

//Renamed to MultiPartRequest from Request
function MultiPartRequest(data, boundary) {
  this.encoding = 'binary';
  this.boundary = boundary || exports.defaultBoundary;
  this.data = data;
  this.partNames = this._partNames();
}

MultiPartRequest.prototype = {
  _partNames: function() {
    var partNames = [];
    for (var name in this.data) {
      partNames.push(name)
  	}
  	return partNames;
  },
  
  write: function(stream, callback) {
    var partCount = 0, self = this;
    
	  // wrap the stream in our own Stream object
  	// See the Stream function above for the benefits of this
  	var stream = new Stream(stream);
  	
  	// Let each part write itself out to the stream
  	(function writePart() {
  	  var partName = self.partNames[partCount];
  	  var part = new Part(partName, self.data[partName], self.boundary);
  	  part.write(stream, function (err) {
  		  if (err) {
    			callback(err);
    			return;
    		}
     		partCount += 1;
    	  if (partCount < self.partNames.length)
    	    writePart();
    		else {
    		  stream.write('--' + self.boundary + '--' + "\r\n");

          if (callback) callback(stream.string || "");
    		}
  	  });
    })(); 
  }
}

var exportMethods = {
  file: function(path, filename, fileSize, encoding, contentType) { 
    return new File(path, filename, fileSize, encoding, contentType)
  },
  data: function(filename, contentType, data) {
    return new Data(filename, contentType, data);
  },
  sizeOf: function(parts, boundary) {
    var totalSize = 0;
	  boundary = boundary || exports.defaultBoundary;
  	for (var name in parts) totalSize += new Part(name, parts[name], boundary).sizeOf();
  	return totalSize + boundary.length + 6;
  },
  write: function(stream, data, callback, boundary) {
    var r = new MultiPartRequest(data, boundary);
    r.write(stream, callback);
    return r;
  }
}

Object.keys(exportMethods).forEach(function(exportMethod) {
  exports[exportMethod] = exportMethods[exportMethod]
})

},{"fs":1,"util":56}],63:[function(require,module,exports){
(function (process,Buffer){
var util      = require('util'),
    events    = require("events"),
    http      = require('http'),
    https     = require('https'),
    url       = require('url'),
    qs        = require('qs'),
    multipart = require('./multipartform'),
    zlib      = require('zlib'),
    iconv     = require('iconv-lite');

function mixin(target, source) {
  source = source || {};
  Object.keys(source).forEach(function(key) {
    target[key] = source[key];
  });

  return target;
}

function Request(uri, options) {
  events.EventEmitter.call(this);
  this.url = url.parse(uri);
  this.options = options;
  this.headers = {
    'Accept': '*/*',
    'User-Agent': 'Restler for node.js',
    'Host': this.url.host
  };

  this.headers['Accept-Encoding'] = 'gzip, deflate';

  mixin(this.headers, options.headers || {});

  // set port and method defaults
  if (!this.url.port) this.url.port = (this.url.protocol == 'https:') ? '443' : '80';
  if (!this.options.method) this.options.method = (this.options.data) ? 'POST' : 'GET';
  if (typeof this.options.followRedirects == 'undefined') this.options.followRedirects = true;

  // stringify query given in options of not given in URL
  if (this.options.query && !this.url.query) {
    if (typeof this.options.query == 'object')
      this.url.query = qs.stringify(this.options.query);
    else this.url.query = this.options.query;
  }

  this._applyAuth();

  if (this.options.multipart) {
    this.headers['Content-Type'] = 'multipart/form-data; boundary=' + multipart.defaultBoundary;
    var multipart_size = multipart.sizeOf(this.options.data, multipart.defaultBoundary);
    if (typeof multipart_size === 'number' && multipart_size === multipart_size) {
        this.headers['Content-Length'] = multipart_size;
    }
    else {
        console.log("Building multipart request without Content-Length header, please specify all file sizes");
    }
  } else {
    if (typeof this.options.data == 'object') {
      this.options.data = qs.stringify(this.options.data);
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      this.headers['Content-Length'] = this.options.data.length;
    }
    if (typeof this.options.data == 'string') {
      var buffer = new Buffer(this.options.data, this.options.encoding || 'utf8');
      this.options.data = buffer;
      this.headers['Content-Length'] = buffer.length;
    }
    if (!this.options.data) {
      this.headers['Content-Length'] = 0;
    }
  }

  var proto = (this.url.protocol == 'https:') ? https : http;

  this.request = proto.request({
    host: this.url.hostname,
    port: this.url.port,
    path: this._fullPath(),
    method: this.options.method,
    headers: this.headers,
    rejectUnauthorized: this.options.rejectUnauthorized
  });

  this._makeRequest();
}

util.inherits(Request, events.EventEmitter);

mixin(Request.prototype, {
  _isRedirect: function(response) {
    return ([301, 302, 303, 307].indexOf(response.statusCode) >= 0);
  },
  _fullPath: function() {
    var path = this.url.pathname || '/';
    if (this.url.hash) path += this.url.hash;
    if (this.url.query) path += '?' + this.url.query;
    return path;
  },
  _applyAuth: function() {
    var authParts;

    if (this.url.auth) {
      authParts = this.url.auth.split(':');
      this.options.username = authParts[0];
      this.options.password = authParts[1];
    }

    if (this.options.username && this.options.password !== undefined) {
      var b = new Buffer([this.options.username, this.options.password].join(':'));
      this.headers['Authorization'] = "Basic " + b.toString('base64');
    } else if (this.options.accessToken) {
      this.headers['Authorization'] = "Bearer " + this.options.accessToken;
    }
  },
  _responseHandler: function(response) {
    var self = this;

    if (self._isRedirect(response) && self.options.followRedirects) {
      try {
        // 303 should redirect and retrieve content with the GET method
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.4
        if (response.statusCode === 303) {
            self.url    = url.parse(url.resolve(self.url.href, response.headers['location']));
            self.options.method = 'GET';
            delete self.options.data;
            self._retry();
        } else {
            self.url = url.parse(url.resolve(self.url.href, response.headers['location']));
            self._retry();
            // todo handle somehow infinite redirects
        }
      } catch(err) {
        err.message = 'Failed to follow redirect: ' + err.message;
        self._fireError(err, response);
      }
    } else {
      var body = '';

      response.setEncoding('binary');

      response.on('data', function(chunk) {
        body += chunk;
      });

      response.on('end', function() {
        response.rawEncoded = body;
        self._decode(new Buffer(body, 'binary'), response, function(err, body) {
          if (err) {
            self._fireError(err, response);
            return;
          }
          response.raw = body;
          body = self._iconv(body, response);
          self._encode(body, response, function(err, body) {
            if (err) {
              self._fireError(err, response);
            } else {
              self._fireSuccess(body, response);
            }
          });
        });
      });
    }
  },
  _decode: function(body, response, callback) {
    var decoder = response.headers['content-encoding'];
    if (decoder in decoders) {
      decoders[decoder].call(response, body, callback);
    } else {
      callback(null, body);
    }
  },
  _iconv: function(body, response) {
    var charset = response.headers['content-type'];
    if (charset) {
      charset = /\bcharset=(.+)(?:;|$)/i.exec(charset);
      if (charset) {
        charset = charset[1].trim().toUpperCase();
        if (charset != 'UTF-8') {
          try {
            return iconv.decode(body, charset);
          } catch (err) {}
        }
      }
    }
    return body;
  },
  _encode: function(body, response, callback) {
    var self = this;
    if (self.options.decoding == 'buffer') {
      callback(null, body);
    } else {
      body = body.toString(self.options.decoding);
      if (self.options.parser) {
        self.options.parser.call(response, body, callback);
      } else {
        callback(null, body);
      }
    }
  },
  _fireError: function(err, response) {
    this._fireCancelTimeout();
    this.emit('error', err, response);
    this.emit('complete', err, response);
  },
  _fireCancelTimeout: function(){
    var self = this;
    if(self.options.timeout){
      clearTimeout(self.options.timeoutFn);
    }
  },
  _fireTimeout: function(err){
    this.emit('timeout', err);
    this.aborted = true;
    this.timedout = true;
    this.request.abort();
  },
  _fireSuccess: function(body, response) {
    if (parseInt(response.statusCode) >= 400) {
      this.emit('fail', body, response);
    } else {
      this.emit('success', body, response);
    }
    this.emit(response.statusCode.toString().replace(/\d{2}$/, 'XX'), body, response);
    this.emit(response.statusCode.toString(), body, response);
    this.emit('complete', body, response);
  },
  _makeRequest: function() {
    var self = this;
    var timeoutMs = self.options.timeout;
    if(timeoutMs){
      self.options.timeoutFn = setTimeout(function(){
        self._fireTimeout(timeoutMs);
      },timeoutMs);
    }
    this.request.on('response', function(response) {
      self._fireCancelTimeout();
      self.emit('response', response);
      self._responseHandler(response);
    }).on('error', function(err) {
      self._fireCancelTimeout();
      if (!self.aborted) {
        self._fireError(err, null);
      }
    });
  },
  _retry: function() {
    this.request.removeAllListeners().on('error', function() {});
    if (this.request.finished) {
      this.request.abort();
    }
    Request.call(this, this.url.href, this.options); // reusing request object to handle recursive calls and remember listeners
    this.run();
  },
  run: function() {
    var self = this;
    if (this.options.multipart) {
      multipart.write(this.request, this.options.data, function() {
        self.request.end();
      });
    } else {
      if (this.options.data) {
        this.request.write(this.options.data.toString(), this.options.encoding || 'utf8');
      }
      this.request.end();
    }

    return this;
  },
  abort: function(err) {
    var self = this;

    if (err) {
      if (typeof err == 'string') {
        err = new Error(err);
      } else if (!(err instanceof Error)) {
        err = new Error('AbortError');
      }
      err.type = 'abort';
    } else {
      err = null;
    }

    self.request.on('close', function() {
      if (err) {
        self._fireError(err, null);
      } else {
        self.emit('complete', null, null);
      }
    });

    self.aborted = true;
    self.request.abort();
    self.emit('abort', err);
    return this;
  },
  retry: function(timeout) {
    var self = this;
    timeout = parseInt(timeout);
    var fn = self._retry.bind(self);
    if (!isFinite(timeout) || timeout <= 0) {
      process.nextTick(fn, timeout);
    } else {
      setTimeout(fn, timeout);
    }
    return this;
  }
});

function shortcutOptions(options, method) {
  options = options || {};
  options.method = method;
  options.parser = (typeof options.parser !== "undefined") ? options.parser : parsers.auto;
  return options;
}

function request(url, options) {
  var request = new Request(url, options);
  request.on('error', function() {});
  process.nextTick(request.run.bind(request));
  return request;
}

function get(url, options) {
 return request(url, shortcutOptions(options, 'GET'));
}

function patch(url, options) {
  return request(url, shortcutOptions(options, 'PATCH'));
}

function post(url, options) {
  return request(url, shortcutOptions(options, 'POST'));
}

function put(url, options) {
  return request(url, shortcutOptions(options, 'PUT'));
}

function del(url, options) {
  return request(url, shortcutOptions(options, 'DELETE'));
}

function head(url, options) {
  return request(url, shortcutOptions(options, 'HEAD'));
}

function json(url, data, options, method) {
  options = options || {};
  options.parser = (typeof options.parser !== "undefined") ? options.parser : parsers.auto;
  options.headers = options.headers || {};
  options.headers['content-type'] = 'application/json';
  options.data = JSON.stringify(data || {});
  options.method = method || 'GET';
  return request(url, options);
}

function postJson(url, data, options) {
  return json(url, data, options, 'POST');
}

function putJson(url, data, options) {
  return json(url, data, options, 'PUT');
}

var parsers = {
  auto: function(data, callback) {
    var contentType = this.headers['content-type'];
    var contentParser;
    if (contentType) {
      contentType = contentType.replace(/;.+/, ''); // remove all except mime type (eg. text/html; charset=UTF-8)
      if (contentType in parsers.auto.matchers) {
        contentParser = parsers.auto.matchers[contentType];
      } else {
        // custom (vendor) mime types
        var parts = contentType.match(/^([\w-]+)\/vnd((?:\.(?:[\w-]+))+)\+([\w-]+)$/i);
        if (parts) {
          var type = parts[1];
          var vendors = parts[2].substr(1).split('.');
          var subtype = parts[3];
          var vendorType;
          while (vendors.pop() && !(vendorType in parsers.auto.matchers)) {
            vendorType = vendors.length
              ? type + '/vnd.' + vendors.join('.') + '+' + subtype
              : vendorType = type + '/' + subtype;
          }
          contentParser = parsers.auto.matchers[vendorType];
        }
      }
    }
    if (typeof contentParser == 'function') {
      contentParser.call(this, data, callback);
    } else {
      callback(null, data);
    }
  },
  json: function(data, callback) {
    if (data && data.length) {
      var parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (err) {
        err.message = 'Failed to parse JSON body: ' + err.message;
        callback(err, null);
      }
      if (parsedData !== undefined) {
        callback(null, parsedData);
      }
    } else {
      callback(null, null);
    }
  }
};

parsers.auto.matchers = {
  'application/json': parsers.json
};

try {
  var yaml = require('yaml');

  parsers.yaml = function(data, callback) {
    if (data) {
      try {
        callback(null, yaml.eval(data));
      } catch (err) {
        err.message = 'Failed to parse YAML body: ' + err.message;
        callback(err, null);
      }
    } else {
      callback(null, null);
    }
  };

  parsers.auto.matchers['application/yaml'] = parsers.yaml;
} catch(e) {}

try {
  var xml2js = require('xml2js');

  parsers.xml = function(data, callback) {
    if (data) {
      var parser = new xml2js.Parser();
      parser.parseString(data, function(err, data) {
        if (err) {
          err.message = 'Failed to parse XML body: ' + err.message;
        }
        callback(err, data);
      });
    } else {
      callback(null, null);
    }
  };

  parsers.auto.matchers['application/xml'] = parsers.xml;
} catch(e) { }

var decoders = {
  gzip: function(buf, callback) {
    zlib.gunzip(buf, callback);
  },
  deflate: function(buf, callback) {
    zlib.inflate(buf, callback);
  }
};


function Service(defaults) {
  if (defaults.baseURL) {
   this.baseURL = defaults.baseURL;
   delete defaults.baseURL;
  }

  this.defaults = defaults;
}

mixin(Service.prototype, {
  request: function(path, options) {
    return request(this._url(path), this._withDefaults(options));
  },
  get: function(path, options) {
    return get(this._url(path), this._withDefaults(options));
  },
  patch: function(path, options) {
    return patch(this._url(path), this._withDefaults(options));
  },
  put: function(path, options) {
    return put(this._url(path), this._withDefaults(options));
  },
  post: function(path, options) {
    return post(this._url(path), this._withDefaults(options));
  },
  json: function(method, path, data, options) {
    return json(this._url(path), data, this._withDefaults(options), method);
  },
  del: function(path, options) {
    return del(this._url(path), this._withDefaults(options));
  },
  _url: function(path) {
    if (this.baseURL) return url.resolve(this.baseURL, path);
    else return path;
  },
  _withDefaults: function(options) {
    var o = mixin({}, this.defaults);
    return mixin(o, options);
  }
});

function service(constructor, defaults, methods) {
  constructor.prototype = new Service(defaults || {});
  mixin(constructor.prototype, methods);
  return constructor;
}

mixin(exports, {
  Request: Request,
  Service: Service,
  request: request,
  service: service,
  get: get,
  patch: patch,
  post: post,
  put: put,
  del: del,
  head: head,
  json: json,
  postJson: postJson,
  putJson: putJson,
  parsers: parsers,
  file: multipart.file,
  data: multipart.data
});


}).call(this,require('_process'),require("buffer").Buffer)
},{"./multipartform":62,"_process":25,"buffer":17,"events":21,"http":46,"https":22,"iconv-lite":69,"qs":70,"url":53,"util":56,"xml2js":72,"yaml":96,"zlib":16}],64:[function(require,module,exports){
var big5Table = require('./table/big5.js');
module.exports = {
	'windows950': 'big5',
	'cp950': 'big5',
	'big5': {
		type: 'table',
		table: big5Table
	}
}

},{"./table/big5.js":67}],65:[function(require,module,exports){
var gbkTable = require('./table/gbk.js');
module.exports = {
	'windows936': 'gbk',
	'gb2312': 'gbk',
	'gbk': {
		type: 'table',
		table: gbkTable
	}
}

},{"./table/gbk.js":68}],66:[function(require,module,exports){
module.exports = {
  "437": "cp437",
  "737": "cp737",
  "775": "cp775",
  "850": "cp850",
  "852": "cp852",
  "855": "cp855",
  "857": "cp857",
  "858": "cp858",
  "860": "cp860",
  "861": "cp861",
  "862": "cp862",
  "863": "cp863",
  "864": "cp864",
  "865": "cp865",
  "866": "cp866",
  "869": "cp869",
  "874": "iso885911",
  "1250": "windows1250",
  "1251": "windows1251",
  "1252": "windows1252",
  "1253": "windows1253",
  "1254": "windows1254",
  "1255": "windows1255",
  "1256": "windows1256",
  "1257": "windows1257",
  "1258": "windows1258",
  "10000": "macroman",
  "10006": "macgreek",
  "10007": "maccyrillic",
  "10029": "maccenteuro",
  "10079": "maciceland",
  "10081": "macturkish",
  "20866": "koi8r",
  "21866": "koi8u",
  "28591": "iso88591",
  "28592": "iso88592",
  "28593": "iso88593",
  "28594": "iso88594",
  "28595": "iso88595",
  "28596": "iso88596",
  "28597": "iso88597",
  "28598": "iso88598",
  "28599": "iso88599",
  "28600": "iso885910",
  "28601": "iso885911",
  "28603": "iso885913",
  "28604": "iso885914",
  "28605": "iso885915",
  "28606": "iso885916",
  "ascii8bit": "ascii",
  "usascii": "ascii",
  "latin1": "iso88591",
  "latin2": "iso88592",
  "latin3": "iso88593",
  "latin4": "iso88594",
  "latin6": "iso885910",
  "latin7": "iso885913",
  "latin8": "iso885914",
  "latin9": "iso885915",
  "latin10": "iso885916",
  "cp819": "iso88951",
  "arabic": "iso88596",
  "arabic8": "iso88596",
  "greek": "iso88597",
  "greek8": "iso88597",
  "hebrew": "iso88598",
  "hebrew8": "iso88598",
  "turkish": "iso88599",
  "turkish8": "iso88599",
  "thai": "iso885911",
  "thai8": "iso885911",
  "tis620": "iso885911",
  "windows874": "iso885911",
  "win874": "iso885911",
  "cp874": "iso885911",
  "celtic": "iso885914",
  "celtic8": "iso885914",
  "cp20866": "koi8r",
  "ibm878": "koi8r",
  "cp21866": "koi8u",
  "ibm1168": "koi8u",
  "windows1250": {
    "type": "singlebyte",
    "chars": "€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
  },
  "win1250": "windows1250",
  "cp1250": "windows1250",
  "windows1251": {
    "type": "singlebyte",
    "chars": "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
  },
  "win1251": "windows1251",
  "cp1251": "windows1251",
  "windows1252": {
    "type": "singlebyte",
    "chars": "€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "win1252": "windows1252",
  "cp1252": "windows1252",
  "windows1253": {
    "type": "singlebyte",
    "chars": "€�‚ƒ„…†‡�‰�‹�����‘’“”•–—�™�›���� ΅Ά£¤¥¦§¨©�«¬­®―°±²³΄µ¶·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"
  },
  "win1253": "windows1253",
  "cp1253": "windows1253",
  "windows1254": {
    "type": "singlebyte",
    "chars": "€�‚ƒ„…†‡ˆ‰Š‹Œ����‘’“”•–—˜™š›œ��Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ"
  },
  "win1254": "windows1254",
  "cp1254": "windows1254",
  "windows1255": {
    "type": "singlebyte",
    "chars": "€�‚ƒ„…†‡ˆ‰�‹�����‘’“”•–—˜™�›���� ¡¢£₪¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾¿ְֱֲֳִֵֶַָֹ�ֻּֽ־ֿ׀ׁׂ׃װױײ׳״�������אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"
  },
  "win1255": "windows1255",
  "cp1255": "windows1255",
  "windows1256": {
    "type": "singlebyte",
    "chars": "€پ‚ƒ„…†‡ˆ‰ٹ‹Œچژڈگ‘’“”•–—ک™ڑ›œ‌‍ں ،¢£¤¥¦§¨©ھ«¬­®¯°±²³´µ¶·¸¹؛»¼½¾؟ہءآأؤإئابةتثجحخدذرزسشصض×طظعغـفقكàلâمنهوçèéêëىيîïًٌٍَôُِ÷ّùْûü‎‏ے"
  },
  "win1256": "windows1256",
  "cp1256": "windows1256",
  "windows1257": {
    "type": "singlebyte",
    "chars": "€�‚�„…†‡�‰�‹�¨ˇ¸�‘’“”•–—�™�›�¯˛� �¢£¤�¦§Ø©Ŗ«¬­®Æ°±²³´µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž˙"
  },
  "win1257": "windows1257",
  "cp1257": "windows1257",
  "windows1258": {
    "type": "singlebyte",
    "chars": "€�‚ƒ„…†‡ˆ‰�‹Œ����‘’“”•–—˜™�›œ��Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
  },
  "win1258": "windows1258",
  "cp1258": "windows1258",
  "iso88591": {
    "type": "singlebyte",
    "chars": " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "cp28591": "iso88591",
  "iso88592": {
    "type": "singlebyte",
    "chars": " Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
  },
  "cp28592": "iso88592",
  "iso88593": {
    "type": "singlebyte",
    "chars": " Ħ˘£¤�Ĥ§¨İŞĞĴ­�Ż°ħ²³´µĥ·¸ışğĵ½�żÀÁÂ�ÄĊĈÇÈÉÊËÌÍÎÏ�ÑÒÓÔĠÖ×ĜÙÚÛÜŬŜßàáâ�äċĉçèéêëìíîï�ñòóôġö÷ĝùúûüŭŝ˙"
  },
  "cp28593": "iso88593",
  "iso88594": {
    "type": "singlebyte",
    "chars": " ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙"
  },
  "cp28594": "iso88594",
  "iso88595": {
    "type": "singlebyte",
    "chars": " ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ"
  },
  "cp28595": "iso88595",
  "iso88596": {
    "type": "singlebyte",
    "chars": " ���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������"
  },
  "cp28596": "iso88596",
  "iso88597": {
    "type": "singlebyte",
    "chars": " ‘’£€₯¦§¨©ͺ«¬­�―°±²³΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"
  },
  "cp28597": "iso88597",
  "iso88598": {
    "type": "singlebyte",
    "chars": " �¢£¤¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"
  },
  "cp28598": "iso88598",
  "iso88599": {
    "type": "singlebyte",
    "chars": " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ"
  },
  "cp28599": "iso88599",
  "iso885910": {
    "type": "singlebyte",
    "chars": " ĄĒĢĪĨĶ§ĻĐŠŦŽ­ŪŊ°ąēģīĩķ·ļđšŧž―ūŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎÏÐŅŌÓÔÕÖŨØŲÚÛÜÝÞßāáâãäåæįčéęëėíîïðņōóôõöũøųúûüýþĸ"
  },
  "cp28600": "iso885910",
  "iso885911": {
    "type": "singlebyte",
    "chars": " กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
  },
  "cp28601": "iso885911",
  "iso885913": {
    "type": "singlebyte",
    "chars": " ”¢£¤„¦§Ø©Ŗ«¬­®Æ°±²³“µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’"
  },
  "cp28603": "iso885913",
  "iso885914": {
    "type": "singlebyte",
    "chars": " Ḃḃ£ĊċḊ§Ẁ©ẂḋỲ­®ŸḞḟĠġṀṁ¶ṖẁṗẃṠỳẄẅṡÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŴÑÒÓÔÕÖṪØÙÚÛÜÝŶßàáâãäåæçèéêëìíîïŵñòóôõöṫøùúûüýŷÿ"
  },
  "cp28604": "iso885914",
  "iso885915": {
    "type": "singlebyte",
    "chars": " ¡¢£€¥Š§š©ª«¬­®¯°±²³Žµ¶·ž¹º»ŒœŸ¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "cp28605": "iso885915",
  "iso885916": {
    "type": "singlebyte",
    "chars": " ĄąŁ€„Š§š©Ș«Ź­źŻ°±ČłŽ”¶·žčș»ŒœŸżÀÁÂĂÄĆÆÇÈÉÊËÌÍÎÏĐŃÒÓÔŐÖŚŰÙÚÛÜĘȚßàáâăäćæçèéêëìíîïđńòóôőöśűùúûüęțÿ"
  },
  "cp28606": "iso885916",
  "cp437": {
    "type": "singlebyte",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm437": "cp437",
  "cp737": {
    "type": "singlebyte",
    "chars": "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ωάέήϊίόύϋώΆΈΉΊΌΎΏ±≥≤ΪΫ÷≈°∙·√ⁿ²■ "
  },
  "ibm737": "cp737",
  "cp775": {
    "type": "singlebyte",
    "chars": "ĆüéāäģåćłēŖŗīŹÄÅÉæÆōöĢ¢ŚśÖÜø£Ø×¤ĀĪóŻżź”¦©®¬½¼Ł«»░▒▓│┤ĄČĘĖ╣║╗╝ĮŠ┐└┴┬├─┼ŲŪ╚╔╩╦╠═╬Žąčęėįšųūž┘┌█▄▌▐▀ÓßŌŃõÕµńĶķĻļņĒŅ’­±“¾¶§÷„°∙·¹³²■ "
  },
  "ibm775": "cp775",
  "cp850": {
    "type": "singlebyte",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ "
  },
  "ibm850": "cp850",
  "cp852": {
    "type": "singlebyte",
    "chars": "ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´­˝˛ˇ˘§÷¸°¨˙űŘř■ "
  },
  "ibm852": "cp852",
  "cp855": {
    "type": "singlebyte",
    "chars": "ђЂѓЃёЁєЄѕЅіІїЇјЈљЉњЊћЋќЌўЎџЏюЮъЪаАбБцЦдДеЕфФгГ«»░▒▓│┤хХиИ╣║╗╝йЙ┐└┴┬├─┼кК╚╔╩╦╠═╬¤лЛмМнНоОп┘┌█▄Пя▀ЯрРсСтТуУжЖвВьЬ№­ыЫзЗшШэЭщЩчЧ§■ "
  },
  "ibm855": "cp855",
  "cp857": {
    "type": "singlebyte",
    "chars": "ÇüéâäàåçêëèïîıÄÅÉæÆôöòûùİÖÜø£ØŞşáíóúñÑĞğ¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ºªÊËÈ�ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµ�×ÚÛÙìÿ¯´­±�¾¶§÷¸°¨·¹³²■ "
  },
  "ibm857": "cp857",
  "cp858": {
    "type": "singlebyte",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈ€ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ "
  },
  "ibm858": "cp858",
  "cp860": {
    "type": "singlebyte",
    "chars": "ÇüéâãàÁçêÊèÍÔìÃÂÉÀÈôõòÚùÌÕÜ¢£Ù₧ÓáíóúñÑªº¿Ò¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm860": "cp860",
  "cp861": {
    "type": "singlebyte",
    "chars": "ÇüéâäàåçêëèÐðÞÄÅÉæÆôöþûÝýÖÜø£Ø₧ƒáíóúÁÍÓÚ¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm861": "cp861",
  "cp862": {
    "type": "singlebyte",
    "chars": "אבגדהוזחטיךכלםמןנסעףפץצקרשת¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm862": "cp862",
  "cp863": {
    "type": "singlebyte",
    "chars": "ÇüéâÂà¶çêëèïî‗À§ÉÈÊôËÏûù¤ÔÜ¢£ÙÛƒ¦´óú¨¸³¯Î⌐¬½¼¾«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm863": "cp863",
  "cp864": {
    "type": "singlebyte",
    "chars": "°·∙√▒─│┼┤┬├┴┐┌└┘β∞φ±½¼≈«»ﻷﻸ��ﻻﻼ� ­ﺂ£¤ﺄ��ﺎﺏﺕﺙ،ﺝﺡﺥ٠١٢٣٤٥٦٧٨٩ﻑ؛ﺱﺵﺹ؟¢ﺀﺁﺃﺅﻊﺋﺍﺑﺓﺗﺛﺟﺣﺧﺩﺫﺭﺯﺳﺷﺻﺿﻁﻅﻋﻏ¦¬÷×ﻉـﻓﻗﻛﻟﻣﻧﻫﻭﻯﻳﺽﻌﻎﻍﻡﹽّﻥﻩﻬﻰﻲﻐﻕﻵﻶﻝﻙﻱ■�"
  },
  "ibm864": "cp864",
  "cp865": {
    "type": "singlebyte",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø₧ƒáíóúñÑªº¿⌐¬½¼¡«¤░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm865": "cp865",
  "cp866": {
    "type": "singlebyte",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■ "
  },
  "ibm866": "cp866",
  "cp869": {
    "type": "singlebyte",
    "chars": "������Ά�·¬¦‘’Έ―ΉΊΪΌ��ΎΫ©Ώ²³ά£έήίϊΐόύΑΒΓΔΕΖΗ½ΘΙ«»░▒▓│┤ΚΛΜΝ╣║╗╝ΞΟ┐└┴┬├─┼ΠΡ╚╔╩╦╠═╬ΣΤΥΦΧΨΩαβγ┘┌█▄δε▀ζηθικλμνξοπρσςτ΄­±υφχ§ψ΅°¨ωϋΰώ■ "
  },
  "ibm869": "cp869",
  "maccenteuro": {
    "type": "singlebyte",
    "chars": "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"
  },
  "maccroatian": {
    "type": "singlebyte",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊�©⁄¤‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ"
  },
  "maccyrillic": {
    "type": "singlebyte",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°¢£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµ∂ЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"
  },
  "macgreek": {
    "type": "singlebyte",
    "chars": "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦­ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ�"
  },
  "maciceland": {
    "type": "singlebyte",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macroman": {
    "type": "singlebyte",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macromania": {
    "type": "singlebyte",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂŞ∞±≤≥¥µ∂∑∏π∫ªºΩăş¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›Ţţ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macthai": {
    "type": "singlebyte",
    "chars": "«»…“”�•‘’� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู﻿​–—฿เแโใไๅๆ็่้๊๋์ํ™๏๐๑๒๓๔๕๖๗๘๙®©����"
  },
  "macturkish": {
    "type": "singlebyte",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙ�ˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macukraine": {
    "type": "singlebyte",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"
  },
  "koi8r": {
    "type": "singlebyte",
    "chars": "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
  },
  "koi8u": {
    "type": "singlebyte",
    "chars": "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґ╝╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪Ґ╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
  }
};

},{}],67:[function(require,module,exports){
module.exports={"33088":19991,"33089":20002,"33090":20012,"33091":20053,"33092":20066,"33093":20106,"33094":20144,"33095":20203,"33096":20205,"33097":20220,"33098":20252,"33099":20362,"33100":20479,"33101":20546,"33102":20560,"33103":20600,"33104":20696,"33105":20702,"33106":20724,"33107":20758,"33108":20810,"33109":20817,"33110":20836,"33111":20842,"33112":20869,"33113":20880,"33114":20893,"33115":20902,"33116":20904,"33117":20905,"33118":20935,"33119":20950,"33120":20955,"33121":20972,"33122":20988,"33123":21003,"33124":21012,"33125":21013,"33126":21024,"33127":21035,"33128":21049,"33129":21071,"33130":21105,"33131":21136,"33132":21138,"33133":21140,"33134":21148,"33135":21167,"33136":21173,"33137":21200,"33138":21248,"33139":21255,"33140":21284,"33141":21318,"33142":21343,"33143":21395,"33144":21424,"33145":21469,"33146":21539,"33147":21584,"33148":21585,"33149":21642,"33150":21661,"33185":21667,"33186":21684,"33187":21712,"33188":21795,"33189":21823,"33190":21836,"33191":21843,"33192":21853,"33193":21868,"33194":21918,"33195":21929,"33196":21996,"33197":22005,"33198":22051,"33199":22096,"33200":22140,"33201":22154,"33202":22164,"33203":22176,"33204":22191,"33205":22232,"33206":22272,"33207":22361,"33208":22373,"33209":22399,"33210":22405,"33211":22409,"33212":22433,"33213":22444,"33214":22452,"33215":22464,"33216":22472,"33217":22483,"33218":22511,"33219":22596,"33220":22636,"33221":22674,"33222":22682,"33223":22706,"33224":22712,"33225":22757,"33226":22779,"33227":22786,"33228":22795,"33229":22800,"33230":22808,"33231":22811,"33232":29836,"33233":29837,"33234":29849,"33235":29851,"33236":29860,"33237":29876,"33238":29881,"33239":29896,"33240":29900,"33241":29904,"33242":29907,"33243":30018,"33244":30037,"33245":30062,"33246":30093,"33247":30110,"33248":30172,"33249":30252,"33250":30287,"33251":30289,"33252":30323,"33253":30324,"33254":30373,"33255":30425,"33256":30478,"33257":30479,"33258":30552,"33259":30578,"33260":30583,"33261":30584,"33262":30586,"33263":30587,"33264":30616,"33265":30639,"33266":30654,"33267":30659,"33268":30661,"33269":30667,"33270":30685,"33271":30694,"33272":30708,"33273":30750,"33274":30781,"33275":30786,"33276":30788,"33277":30795,"33278":30801,"33344":21782,"33345":22775,"33346":38964,"33347":33883,"33348":28948,"33349":33398,"33350":35158,"33351":40236,"33352":40206,"33353":36527,"33354":24674,"33355":26214,"33356":34510,"33357":25785,"33358":37772,"33359":22107,"33360":28485,"33361":35532,"33362":29001,"33363":24012,"33364":34633,"33365":39464,"33366":31658,"33367":36107,"33368":39255,"33369":23597,"33370":32331,"33371":38938,"33372":20518,"33373":25458,"33374":40568,"33375":30783,"33376":40633,"33377":40634,"33378":36046,"33379":35715,"33380":61305,"33381":33931,"33382":37284,"33383":31331,"33384":25776,"33385":24061,"33386":24214,"33387":32865,"33388":26965,"33389":31466,"33390":28710,"33391":26812,"33392":31095,"33393":28060,"33394":36841,"33395":31074,"33396":22178,"33397":34687,"33398":21093,"33399":31108,"33400":28300,"33401":37271,"33402":31622,"33403":38956,"33404":26717,"33405":20397,"33406":34222,"33441":31725,"33442":34635,"33443":20534,"33444":26893,"33445":27542,"33446":24910,"33447":20855,"33448":30495,"33449":20516,"33450":32622,"33451":30452,"33452":27097,"33453":24803,"33454":25334,"33455":21599,"33456":38788,"33457":22092,"33458":20677,"33459":22040,"33460":34398,"33461":22834,"33462":22875,"33463":22877,"33464":22883,"33465":22892,"33466":22939,"33467":22999,"33468":23019,"33469":23066,"33470":23210,"33471":23248,"33472":23281,"33473":23350,"33474":23497,"33475":23539,"33476":23571,"33477":23580,"33478":23582,"33479":23635,"33480":23705,"33481":23708,"33482":23738,"33483":23739,"33484":23745,"33485":23797,"33486":23802,"33487":23829,"33488":23832,"33489":23870,"33490":23891,"33491":23900,"33492":23917,"33493":23923,"33494":23924,"33495":23948,"33496":23952,"33497":23993,"33498":24016,"33499":24019,"33500":24135,"33501":24164,"33502":24271,"33503":24272,"33504":24298,"33505":24304,"33506":24329,"33507":24332,"33508":24337,"33509":24353,"33510":24372,"33511":24385,"33512":24389,"33513":24401,"33514":24412,"33515":24422,"33516":24451,"33517":24560,"33518":24650,"33519":24672,"33520":24715,"33521":24742,"33522":24798,"33523":24849,"33524":24864,"33525":24865,"33526":24892,"33527":24893,"33528":24984,"33529":25015,"33530":25076,"33531":25107,"33532":25117,"33533":25118,"33534":25143,"33600":24186,"33601":27664,"33602":21454,"33603":20267,"33604":20302,"33605":21556,"33606":22257,"33607":22766,"33608":22841,"33609":22918,"33610":23596,"33611":20915,"33612":20914,"33613":28798,"33614":35265,"33615":35282,"33616":36125,"33617":36710,"33618":20122,"33619":26469,"33620":20177,"33621":20004,"33622":21327,"33623":23626,"33624":20872,"33625":24213,"33626":25269,"33627":19996,"33628":20105,"33629":29366,"33630":31868,"33631":32416,"33632":21351,"33633":36711,"33634":37048,"33635":38271,"33636":38376,"33637":20384,"33638":20387,"33639":20822,"33640":21017,"33641":21170,"33642":21364,"33643":22850,"33644":24069,"33645":26594,"33646":27769,"33647":20026,"33648":32419,"33649":32418,"33650":32426,"33651":32427,"33652":32421,"33653":32422,"33654":32417,"33655":32989,"33656":33486,"33657":35745,"33658":35746,"33659":35747,"33660":36126,"33661":36127,"33662":20891,"33697":36712,"33698":38377,"33699":38886,"33700":39029,"33701":39118,"33702":39134,"33703":20457,"33704":20204,"33705":20261,"33706":20010,"33707":20262,"33708":20179,"33709":20923,"33710":21018,"33711":21093,"33712":21592,"33713":23089,"33714":23385,"33715":23777,"33716":23707,"33717":23704,"33718":24072,"33719":24211,"33720":24452,"33721":25375,"33722":26102,"33723":26187,"33724":20070,"33725":27902,"33726":27971,"33727":20044,"33728":29421,"33729":29384,"33730":20137,"33731":30757,"33732":31210,"33733":32442,"33734":32433,"33735":32441,"33736":32431,"33737":32445,"33738":32432,"33739":32423,"33740":32429,"33741":32435,"33742":32440,"33743":32439,"33744":32961,"33745":33033,"33746":21005,"33747":35760,"33748":35750,"33749":35752,"33750":35751,"33751":35754,"33752":35759,"33753":35757,"33754":35755,"33755":23682,"33756":36130,"33757":36129,"33758":36713,"33759":36715,"33760":38025,"33761":38024,"33762":38026,"33763":38027,"33764":38378,"33765":38453,"33766":38485,"33767":38473,"33768":39269,"33769":39532,"33770":39592,"33771":20266,"33772":20255,"33773":20390,"33774":20391,"33775":21153,"33776":21160,"33777":21306,"33778":21442,"33779":21713,"33780":38382,"33781":34900,"33782":22269,"33783":22362,"33784":22441,"33785":25191,"33786":22815,"33787":23044,"33788":22919,"33789":19987,"33790":23558,"33856":23625,"33857":23781,"33858":23703,"33859":24102,"33860":24080,"33861":24352,"33862":24378,"33863":20174,"33864":24469,"33865":20932,"33866":24581,"33867":25195,"33868":25346,"33869":25194,"33870":25249,"33871":25379,"33872":36133,"33873":21551,"33874":26011,"33875":26025,"33876":26172,"33877":21206,"33878":24323,"33879":26465,"33880":26541,"33881":26432,"33882":27682,"33883":20937,"33884":27973,"33885":28170,"33886":27882,"33887":27814,"33888":20928,"33889":29301,"33890":29424,"33891":29616,"33892":20135,"33893":27605,"33894":24322,"33895":20247,"33896":32458,"33897":32479,"33898":32461,"33899":32459,"33900":32460,"33901":32454,"33902":32453,"33903":32452,"33904":32456,"33905":32449,"33906":32450,"33907":38069,"33908":20064,"33909":33626,"33910":33550,"33911":33682,"33912":24196,"33913":33483,"33914":22788,"33915":26415,"33916":34926,"33917":35269,"33918":35268,"33953":35775,"33954":35766,"33955":35776,"33956":35767,"33957":35768,"33958":35774,"33959":35772,"33960":35769,"33961":36137,"33962":36131,"33963":36143,"33964":36135,"33965":36138,"33966":36139,"33967":36717,"33968":36719,"33969":36825,"33970":36830,"33971":36851,"33972":38039,"33973":38035,"33974":38031,"33975":38034,"33976":38381,"33977":38472,"33978":38470,"33979":38452,"33980":39030,"33981":39031,"33982":40060,"33983":40479,"33984":21348,"33985":40614,"33986":22791,"33987":20263,"33988":20254,"33989":20975,"33990":21056,"33991":21019,"33992":21171,"33993":21195,"33994":20007,"33995":21333,"33996":21727,"33997":21796,"33998":20052,"33999":22260,"34000":23591,"34001":22330,"34002":25253,"34003":22490,"34004":22774,"34005":23090,"34006":23547,"34007":23706,"34008":24103,"34009":24079,"34010":21397,"34011":21417,"34012":24694,"34013":38391,"34014":24812,"34015":24699,"34016":24700,"34017":25315,"34018":25381,"34019":25442,"34020":25196,"34021":26531,"34022":26635,"34023":26632,"34024":38054,"34025":27531,"34026":22771,"34027":27695,"34028":27689,"34029":28044,"34030":20945,"34031":28270,"34032":28065,"34033":27748,"34034":27979,"34035":27985,"34036":28067,"34037":26080,"34038":29369,"34039":33487,"34040":30011,"34041":30153,"34042":21457,"34043":30423,"34044":30746,"34045":31174,"34046":31383,"34112":31508,"34113":31499,"34114":32478,"34115":32467,"34116":32466,"34117":32477,"34118":19997,"34119":32476,"34120":32473,"34121":32474,"34122":32470,"34123":32475,"34124":32899,"34125":32958,"34126":32960,"34127":21326,"34128":33713,"34129":33484,"34130":34394,"34131":35270,"34132":35780,"34133":35789,"34134":35777,"34135":35778,"34136":35791,"34137":35781,"34138":35784,"34139":35787,"34140":35785,"34141":35786,"34142":35779,"34143":36142,"34144":36148,"34145":36144,"34146":36155,"34147":36146,"34148":36153,"34149":36154,"34150":36149,"34151":20080,"34152":36140,"34153":36152,"34154":36151,"34155":36722,"34156":36724,"34157":36726,"34158":36827,"34159":37038,"34160":20065,"34161":38046,"34162":38062,"34163":38041,"34164":38048,"34165":38055,"34166":38045,"34167":38052,"34168":38051,"34169":38389,"34170":38384,"34171":24320,"34172":38386,"34173":38388,"34174":38387,"34209":38431,"34210":38454,"34211":38451,"34212":38887,"34213":39033,"34214":39034,"34215":39035,"34216":39274,"34217":39277,"34218":39272,"34219":39278,"34220":39276,"34221":20911,"34222":39533,"34223":20081,"34224":20538,"34225":20256,"34226":20165,"34227":20542,"34228":20260,"34229":20588,"34230":38130,"34231":21183,"34232":31215,"34233":27719,"34234":21527,"34235":21596,"34236":21595,"34237":22253,"34238":22278,"34239":28034,"34240":22359,"34241":22366,"34242":22488,"34243":33556,"34244":22885,"34245":22920,"34246":29233,"34247":24574,"34248":24582,"34249":24698,"34250":25439,"34251":25250,"34252":25443,"34253":26500,"34254":26198,"34255":26197,"34256":26104,"34257":20250,"34258":19994,"34259":26497,"34260":26472,"34261":26722,"34262":26539,"34263":23681,"34264":27807,"34265":28781,"34266":28287,"34267":28369,"34268":27815,"34269":28902,"34270":28860,"34271":28800,"34272":28949,"34273":29239,"34274":29422,"34275":29502,"34276":29682,"34277":24403,"34278":30415,"34279":30544,"34280":30529,"34281":38606,"34282":30860,"34283":33410,"34284":31509,"34285":31908,"34286":32463,"34287":32482,"34288":32465,"34289":32485,"34290":32486,"34291":20041,"34292":32673,"34293":22307,"34294":32928,"34295":33050,"34296":32959,"34297":33041,"34298":33636,"34299":33479,"34300":21494,"34301":33716,"34302":34398,"34368":34383,"34369":21495,"34370":34568,"34371":34476,"34372":34917,"34373":35013,"34374":35815,"34375":35813,"34376":35814,"34377":35797,"34378":35799,"34379":35800,"34380":35801,"34381":35811,"34382":35802,"34383":35805,"34384":35803,"34385":35809,"34386":35810,"34387":35808,"34388":35807,"34389":36156,"34390":36164,"34391":36158,"34392":36159,"34393":36160,"34394":36161,"34395":36162,"34396":36165,"34397":36739,"34398":36733,"34399":36732,"34400":36734,"34401":20892,"34402":36816,"34403":36798,"34404":36829,"34405":36807,"34406":37049,"34407":38068,"34408":38067,"34409":38073,"34410":38072,"34411":38078,"34412":38080,"34413":38085,"34414":38057,"34415":38082,"34416":38083,"34417":38089,"34418":38091,"34419":38044,"34420":38093,"34421":38079,"34422":38086,"34423":38392,"34424":38504,"34425":38589,"34426":30005,"34427":39044,"34428":39037,"34429":39039,"34430":39036,"34465":39041,"34466":39042,"34467":39282,"34468":39284,"34469":39281,"34470":39280,"34471":39536,"34472":39534,"34473":39535,"34474":40480,"34475":20389,"34476":20392,"34477":21294,"34478":21388,"34479":23581,"34480":21589,"34481":21497,"34482":21949,"34483":21863,"34484":21716,"34485":22242,"34486":22270,"34487":23576,"34488":22443,"34489":22545,"34490":23551,"34491":26790,"34492":22842,"34493":22849,"34494":22954,"34495":23454,"34496":23517,"34497":23545,"34498":23649,"34499":23853,"34500":23702,"34501":24065,"34502":24124,"34503":24443,"34504":24577,"34505":24815,"34506":24696,"34507":24813,"34508":24808,"34509":25602,"34510":25524,"34511":25530,"34512":30021,"34513":33635,"34514":26538,"34515":28378,"34516":28173,"34517":27721,"34518":28385,"34519":28382,"34520":28176,"34521":28072,"34522":28063,"34523":27818,"34524":28180,"34525":28183,"34526":28068,"34527":33639,"34528":23572,"34529":33638,"34530":29425,"34531":29712,"34532":29595,"34533":30111,"34534":30113,"34535":30127,"34536":30186,"34537":23613,"34538":30417,"34539":30805,"34540":31087,"34541":31096,"34542":31181,"34543":31216,"34544":27964,"34545":31389,"34546":31546,"34547":31581,"34548":32509,"34549":32510,"34550":32508,"34551":32496,"34552":32491,"34553":32511,"34554":32039,"34555":32512,"34556":32434,"34557":32494,"34558":32504,"34624":32501,"34625":32438,"34626":32500,"34627":32490,"34628":32513,"34629":32502,"34630":32602,"34631":38395,"34632":33669,"34633":30422,"34634":33642,"34635":33485,"34636":34432,"34637":35829,"34638":35821,"34639":35820,"34640":35748,"34641":35819,"34642":35823,"34643":35828,"34644":35824,"34645":35826,"34646":35825,"34647":35827,"34648":35822,"34649":23486,"34650":36168,"34651":36170,"34652":36213,"34653":36214,"34654":36741,"34655":36740,"34656":36731,"34657":36828,"34658":36874,"34659":36882,"34660":38128,"34661":38134,"34662":38108,"34663":38125,"34664":38114,"34665":38124,"34666":38120,"34667":38133,"34668":38115,"34669":38402,"34670":38394,"34671":38397,"34672":38401,"34673":38400,"34674":38469,"34675":39047,"34676":39046,"34677":39122,"34678":39290,"34679":39292,"34680":39285,"34681":39287,"34682":39539,"34683":32942,"34684":39600,"34685":40483,"34686":40482,"34721":20964,"34722":40784,"34723":20159,"34724":20202,"34725":20215,"34726":20396,"34727":20393,"34728":20461,"34729":21095,"34730":21016,"34731":21073,"34732":21053,"34733":21385,"34734":21792,"34735":22068,"34736":21719,"34737":22040,"34738":21943,"34739":21880,"34740":21501,"34741":22687,"34742":22367,"34743":22368,"34744":22549,"34745":23092,"34746":23157,"34747":22953,"34748":23047,"34749":23046,"34750":23485,"34751":23457,"34752":20889,"34753":23618,"34754":23956,"34755":24092,"34756":24223,"34757":21416,"34758":24217,"34759":21422,"34760":24191,"34761":24377,"34762":24198,"34763":34385,"34764":24551,"34765":24578,"34766":24751,"34767":24814,"34768":24868,"34769":24579,"34770":25370,"34771":25169,"34772":25438,"34773":25320,"34774":25376,"34775":25242,"34776":25528,"34777":25599,"34778":25932,"34779":25968,"34780":26242,"34781":26165,"34782":26679,"34783":26729,"34784":26530,"34785":26631,"34786":27004,"34787":26728,"34788":20048,"34789":26526,"34790":27431,"34791":27527,"34792":27572,"34793":27974,"34794":27900,"34795":27905,"34796":27975,"34797":28291,"34798":28070,"34799":28071,"34800":27988,"34801":28909,"34802":22870,"34803":33721,"34804":30126,"34805":30353,"34806":30385,"34807":30424,"34808":30830,"34809":30721,"34810":31377,"34811":31351,"34812":32532,"34813":32451,"34814":32428,"34880":32516,"34881":32517,"34882":32521,"34883":32534,"34884":32536,"34885":32447,"34886":32526,"34887":32531,"34888":32525,"34889":32514,"34890":32520,"34891":32519,"34892":39554,"34893":32610,"34894":33014,"34895":32932,"34896":33714,"34897":33643,"34898":33931,"34899":34430,"34900":34583,"34901":21355,"34902":35850,"34903":35845,"34904":35848,"34905":35846,"34906":35806,"34907":35831,"34908":35832,"34909":35838,"34910":35839,"34911":35844,"34912":35843,"34913":35841,"34914":35770,"34915":35812,"34916":35847,"34917":35837,"34918":35840,"34919":31446,"34920":36180,"34921":36175,"34922":36171,"34923":36145,"34924":36134,"34925":36172,"34926":36132,"34927":21334,"34928":36176,"34929":36136,"34930":36179,"34931":36341,"34932":36745,"34933":36742,"34934":36749,"34935":36744,"34936":36743,"34937":36718,"34938":36750,"34939":36747,"34940":36746,"34941":36866,"34942":36801,"34977":37051,"34978":37073,"34979":37011,"34980":38156,"34981":38161,"34982":38144,"34983":38138,"34984":38096,"34985":38148,"34986":38109,"34987":38160,"34988":38153,"34989":38155,"34990":38049,"34991":38146,"34992":38398,"34993":38405,"34994":24041,"34995":39049,"34996":39052,"34997":20859,"34998":39295,"34999":39297,"35000":39548,"35001":39547,"35002":39543,"35003":39542,"35004":39549,"35005":39550,"35006":39545,"35007":39544,"35008":39607,"35009":38393,"35010":40063,"35011":40065,"35012":40489,"35013":40486,"35014":40632,"35015":40831,"35016":20454,"35017":20647,"35018":20394,"35019":24130,"35020":21058,"35021":21544,"35022":21725,"35023":22003,"35024":22438,"35025":22363,"35026":22859,"35027":34949,"35028":23398,"35029":23548,"35030":23466,"35031":20973,"35032":24811,"35033":25044,"35034":24518,"35035":25112,"35036":25317,"35037":25377,"35038":25374,"35039":25454,"35040":25523,"35041":25321,"35042":25441,"35043":25285,"35044":25373,"35045":21382,"35046":26195,"35047":26196,"35048":26137,"35049":26726,"35050":27178,"35051":26641,"35052":26925,"35053":26725,"35054":26426,"35055":26721,"35056":28096,"35057":27987,"35058":27901,"35059":27978,"35060":27811,"35061":28582,"35062":28177,"35063":28861,"35064":28903,"35065":28783,"35066":28907,"35067":28950,"35068":29420,"35069":29585,"35070":29935,"35136":30232,"35137":21346,"35138":30610,"35139":30742,"35140":30875,"35141":31215,"35142":39062,"35143":31267,"35144":31397,"35145":31491,"35146":31579,"35147":32546,"35148":32547,"35149":33830,"35150":32538,"35151":21439,"35152":32543,"35153":32540,"35154":32537,"35155":32457,"35156":33147,"35157":20852,"35158":33329,"35159":33633,"35160":33831,"35161":33436,"35162":34434,"35163":33828,"35164":35044,"35165":20146,"35166":35278,"35167":35867,"35168":35866,"35169":35855,"35170":35763,"35171":35851,"35172":35853,"35173":35856,"35174":35864,"35175":35834,"35176":35858,"35177":35859,"35178":35773,"35179":35861,"35180":35865,"35181":35852,"35182":35862,"35183":36182,"35184":36752,"35185":36753,"35186":36755,"35187":36751,"35188":21150,"35189":36873,"35190":36831,"35191":36797,"35192":36951,"35193":37050,"35194":38189,"35195":38191,"35196":38192,"35197":38169,"35198":38065,"35233":38050,"35234":38177,"35235":24405,"35236":38126,"35237":38181,"35238":38182,"35239":38175,"35240":38178,"35241":38193,"35242":38414,"35243":38543,"35244":38505,"35245":38745,"35246":33148,"35247":39050,"35248":39048,"35249":39057,"35250":39060,"35251":22836,"35252":39059,"35253":39056,"35254":39302,"35255":39279,"35256":39300,"35257":39301,"35258":39559,"35259":39560,"35260":39558,"35261":39608,"35262":39612,"35263":40077,"35264":40501,"35265":40490,"35266":40495,"35267":40493,"35268":40499,"35269":40857,"35270":40863,"35271":20248,"35272":20607,"35273":20648,"35274":21169,"35275":21659,"35276":21523,"35277":21387,"35278":22489,"35279":23156,"35280":23252,"35281":23351,"35282":23604,"35283":23654,"35284":23679,"35285":23896,"35286":24110,"35287":24357,"35288":24212,"35289":24691,"35290":25103,"35291":20987,"35292":25380,"35293":25319,"35294":25311,"35295":25601,"35296":25947,"35297":27609,"35298":26279,"35299":26723,"35300":26816,"35301":26727,"35302":26633,"35303":27183,"35304":27539,"35305":27617,"35306":27870,"35307":28392,"35308":27982,"35309":28059,"35310":28389,"35311":28073,"35312":28493,"35313":33829,"35314":28799,"35315":28891,"35316":28905,"35317":22681,"35318":29406,"35319":33719,"35320":29615,"35321":29815,"35322":30184,"35323":30103,"35324":30699,"35325":30970,"35326":30710,"35392":31699,"35393":31914,"35394":38214,"35395":31937,"35396":32553,"35397":32489,"35398":32554,"35399":32533,"35400":32551,"35401":32503,"35402":32541,"35403":24635,"35404":32437,"35405":32555,"35406":32420,"35407":32549,"35408":32358,"35409":32550,"35410":22768,"35411":32874,"35412":32852,"35413":32824,"35414":33043,"35415":32966,"35416":33080,"35417":33037,"35418":20020,"35419":20030,"35420":33392,"35421":34103,"35422":34015,"35423":20111,"35424":34684,"35425":34632,"35426":20149,"35427":35099,"35428":35274,"35429":35868,"35430":35876,"35431":35878,"35432":35762,"35433":35854,"35434":35875,"35435":35874,"35436":35466,"35437":35879,"35438":36186,"35439":36187,"35440":36141,"35441":36185,"35442":36235,"35443":36758,"35444":36759,"35445":27586,"35446":36757,"35447":33286,"35448":36824,"35449":36808,"35450":37213,"35451":38208,"35452":38209,"35453":38170,"35454":38190,"35489":38194,"35490":38149,"35491":38180,"35492":38202,"35493":38201,"35494":38203,"35495":38206,"35496":38199,"35497":38420,"35498":38421,"35499":38417,"35500":38385,"35501":38544,"35502":38582,"35503":34429,"35504":38889,"35505":39063,"35506":39123,"35507":39563,"35508":39567,"35509":40092,"35510":40091,"35511":40084,"35512":40081,"35513":40511,"35514":40509,"35515":28857,"35516":25995,"35517":19995,"35518":22108,"35519":22329,"35520":22418,"35521":23158,"35522":25041,"35523":25193,"35524":25527,"35525":25200,"35526":25781,"35527":25670,"35528":25822,"35529":25783,"35530":26029,"35531":27103,"35532":26588,"35533":27099,"35534":26592,"35535":27428,"35536":24402,"35537":27553,"35538":27899,"35539":28182,"35540":28388,"35541":28174,"35542":28293,"35543":27983,"35544":28908,"35545":28952,"35546":29367,"35547":29454,"35548":29934,"35549":30112,"35550":30545,"35551":30784,"35552":31036,"35553":31313,"35554":31229,"35555":31388,"35556":31373,"35557":31659,"35558":31783,"35559":31658,"35560":31697,"35561":31616,"35562":31918,"35563":32455,"35564":32558,"35565":32469,"35566":32557,"35567":32483,"35568":32559,"35569":32728,"35570":32844,"35571":32834,"35572":33040,"35573":33169,"35574":26087,"35575":33832,"35576":34013,"35577":33632,"35578":34546,"35579":34633,"35580":35280,"35581":35294,"35582":35871,"35648":35880,"35649":35884,"35650":35882,"35651":36184,"35652":36434,"35653":36857,"35654":36344,"35655":36527,"35656":36716,"35657":36761,"35658":36841,"35659":21307,"35660":37233,"35661":38225,"35662":38145,"35663":38056,"35664":38221,"35665":38215,"35666":38224,"35667":38226,"35668":38217,"35669":38422,"35670":38383,"35671":38423,"35672":38425,"35673":26434,"35674":21452,"35675":38607,"35676":40481,"35677":39069,"35678":39068,"35679":39064,"35680":39066,"35681":39067,"35682":39311,"35683":39306,"35684":39304,"35685":39569,"35686":39617,"35687":40104,"35688":40100,"35689":40107,"35690":40103,"35691":40515,"35692":40517,"35693":40516,"35694":22404,"35695":22364,"35696":23456,"35697":24222,"35698":24208,"35699":24809,"35700":24576,"35701":25042,"35702":25314,"35703":26103,"35704":27249,"35705":26911,"35706":27016,"35707":27257,"35708":28487,"35709":28625,"35710":27813,"35745":28626,"35746":27896,"35747":28865,"35748":29261,"35749":29322,"35750":20861,"35751":29549,"35752":29626,"35753":29756,"35754":30068,"35755":30250,"35756":30861,"35757":31095,"35758":31283,"35759":31614,"35760":33575,"35761":32462,"35762":32499,"35763":32472,"35764":32599,"35765":32564,"35766":33211,"35767":33402,"35768":34222,"35769":33647,"35770":34433,"35771":34631,"35772":35014,"35773":34948,"35774":35889,"35775":35782,"35776":35885,"35777":35890,"35778":35749,"35779":35887,"35780":36192,"35781":36190,"35782":36343,"35783":36762,"35784":36735,"35785":36766,"35786":36793,"35787":38236,"35788":38237,"35789":38238,"35790":38142,"35791":38231,"35792":38232,"35793":38230,"35794":38233,"35795":38197,"35796":38210,"35797":38143,"35798":37694,"35799":20851,"35800":38471,"35801":38590,"35802":38654,"35803":38892,"35804":38901,"35805":31867,"35806":39072,"35807":39125,"35808":39314,"35809":39313,"35810":39579,"35811":39575,"35812":40120,"35813":40115,"35814":40109,"35815":40119,"35816":40529,"35817":40521,"35818":40522,"35819":40524,"35820":40527,"35821":20029,"35822":40628,"35823":21149,"35824":21657,"35825":22052,"35826":20005,"35827":23453,"35828":24748,"35829":24527,"35830":25318,"35831":25600,"35832":32999,"35833":27015,"35834":28572,"35835":28491,"35836":28809,"35837":29649,"35838":30719,"35904":30778,"35905":30718,"35906":30782,"35907":31398,"35908":31454,"35909":31609,"35910":31726,"35911":36779,"35912":32548,"35913":32487,"35914":32578,"35915":33002,"35916":33328,"35917":34108,"35918":34106,"35919":33446,"35920":33529,"35921":34164,"35922":34461,"35923":35124,"35924":35273,"35925":35302,"35926":35758,"35927":35793,"35928":35893,"35929":36194,"35930":36193,"35931":36280,"35932":37322,"35933":38047,"35934":38105,"35935":38152,"35936":38416,"35937":39128,"35938":39286,"35939":39269,"35940":39582,"35941":33150,"35942":39578,"35943":40131,"35944":40133,"35945":20826,"35946":40835,"35947":40836,"35948":20458,"35949":21995,"35950":21869,"35951":22179,"35952":23646,"35953":24807,"35954":24913,"35955":25668,"35956":25658,"35957":26003,"35958":27185,"35959":26639,"35960":26818,"35961":27516,"35962":28866,"35963":29306,"35964":38262,"35965":29838,"35966":30302,"36001":32544,"36002":32493,"36003":20848,"36004":34259,"36005":34510,"36006":35272,"36007":35892,"36008":25252,"36009":35465,"36010":36163,"36011":36364,"36012":36291,"36013":36347,"36014":36720,"36015":36777,"36016":38256,"36017":38253,"36018":38081,"36019":38107,"36020":38094,"36021":38255,"36022":38220,"36023":21709,"36024":39038,"36025":39074,"36026":39144,"36027":39537,"36028":39584,"36029":34022,"36030":39585,"36031":39621,"36032":40141,"36033":40143,"36034":33722,"36035":40548,"36036":40542,"36037":40839,"36038":40840,"36039":21870,"36040":20456,"36041":20645,"36042":21587,"36043":23402,"36044":24005,"36045":23782,"36046":24367,"36047":25674,"36048":26435,"36049":27426,"36050":28393,"36051":29473,"36052":21472,"36053":30270,"36054":30307,"36055":31548,"36056":31809,"36057":32843,"36058":33039,"36059":34989,"36060":34924,"36061":35835,"36062":36174,"36063":36189,"36064":36399,"36065":36396,"36066":36756,"36067":37094,"36068":38136,"36069":37492,"36070":38657,"36071":38801,"36072":32366,"36073":39076,"36074":39556,"36075":39553,"36076":40150,"36077":40098,"36078":40148,"36079":40151,"36080":40551,"36081":40485,"36082":40761,"36083":40841,"36084":40842,"36085":40858,"36086":24651,"36087":25371,"36088":25605,"36089":29906,"36090":31363,"36091":32552,"36092":33250,"36093":33821,"36094":34506,"36160":21464,"36161":36902,"36162":36923,"36163":38259,"36164":38084,"36165":38757,"36166":26174,"36167":39181,"36168":24778,"36169":39551,"36170":39564,"36171":39635,"36172":39633,"36173":40157,"36174":40158,"36175":40156,"36176":40502,"36177":22065,"36178":22365,"36179":25597,"36180":30251,"36181":30315,"36182":32641,"36183":34453,"36184":35753,"36185":35863,"36186":35894,"36187":33395,"36188":36195,"36189":37247,"36190":38643,"36191":28789,"36192":38701,"36193":39078,"36194":39588,"36195":39699,"36196":39751,"36197":40078,"36198":40560,"36199":40557,"36200":30839,"36201":30416,"36202":40140,"36203":40844,"36204":40843,"36205":21381,"36206":27012,"36207":28286,"36208":31729,"36209":31657,"36210":34542,"36211":35266,"36212":36433,"36213":34885,"36214":38053,"36215":39045,"36216":39307,"36217":39627,"36218":40649,"36219":28390,"36220":30633,"36221":38218,"36222":38831,"36257":39540,"36258":39589,"36259":32518,"36260":35872,"36261":36495,"36262":37245,"36263":38075,"36264":37550,"36265":38179,"36266":40132,"36267":40072,"36268":40681,"36269":20991,"36270":40550,"36271":39562,"36272":40563,"36273":40510,"36274":38074,"36275":20162,"36276":34381,"36277":27538,"36278":22439,"36279":22395,"36280":25099,"36281":20451,"36282":21037,"36283":21389,"36284":21593,"36285":21370,"36286":32424,"36287":33543,"36288":38023,"36289":38022,"36290":21591,"36291":24362,"36292":31059,"36293":32446,"36294":37071,"36295":38028,"36296":21072,"36297":21286,"36298":22261,"36299":22445,"36300":23045,"36301":23741,"36302":23811,"36303":28062,"36304":28172,"36305":28867,"36306":30502,"36307":32448,"36308":32464,"36309":33003,"36310":38030,"36311":38032,"36312":38037,"36313":38029,"36314":38379,"36315":22955,"36316":23899,"36317":24701,"36318":26720,"36319":26536,"36320":27817,"36321":27976,"36322":30066,"36323":30743,"36324":32471,"36325":33757,"36326":35271,"36327":35765,"36328":35790,"36329":35794,"36330":36150,"36331":36147,"36332":36730,"36333":36725,"36334":36728,"36335":36911,"36336":37075,"36337":37124,"36338":38059,"36339":38060,"36340":38043,"36341":38063,"36342":38061,"36343":38058,"36344":38390,"36345":38503,"36346":39032,"36347":39275,"36348":40697,"36349":20251,"36350":20603,"36416":20325,"36417":21794,"36418":22450,"36419":24047,"36420":24493,"36421":28828,"36422":33557,"36423":29426,"36424":29614,"36425":32488,"36426":32480,"36427":32481,"36428":32671,"36429":33645,"36430":34545,"36431":35795,"36432":35798,"36433":35817,"36434":35796,"36435":35804,"36436":36241,"36437":36738,"36438":36737,"36439":37036,"36440":38090,"36441":38088,"36442":38064,"36443":38066,"36444":38070,"36445":38157,"36446":38092,"36447":38077,"36448":38076,"36449":39043,"36450":39040,"36451":20971,"36452":40702,"36453":20606,"36454":21787,"36455":23901,"36456":24123,"36457":24747,"36458":24749,"36459":24580,"36460":25132,"36461":25111,"36462":25247,"36463":25248,"36464":25532,"36465":26724,"36466":26473,"36467":33637,"36468":27986,"36469":27812,"36470":28829,"36471":30386,"36472":30720,"36473":32507,"36474":32498,"36475":32495,"36476":32506,"36477":33715,"36478":35275,"36513":35830,"36514":36167,"36515":38129,"36516":38098,"36517":38097,"36518":38101,"36519":38111,"36520":38123,"36521":38127,"36522":38122,"36523":38135,"36524":38102,"36525":38117,"36526":39121,"36527":21055,"36528":21154,"36529":21715,"36530":21586,"36531":23810,"36532":23780,"36533":24209,"36534":24870,"36535":25378,"36536":26912,"36537":27637,"36538":39053,"36539":28061,"36540":28514,"36541":28064,"36542":28375,"36543":29711,"36544":29825,"36545":30231,"36546":32515,"36547":32535,"36548":32524,"36549":32527,"36550":32529,"36551":33628,"36552":33932,"36553":33553,"36554":33473,"36555":35833,"36556":35836,"36557":35842,"36558":36181,"36559":37112,"36560":38162,"36561":38103,"36562":38141,"36563":38163,"36564":38154,"36565":38116,"36566":38150,"36567":38151,"36568":38164,"36569":38406,"36570":38403,"36571":38739,"36572":39055,"36573":39293,"36574":39541,"36575":39552,"36576":40066,"36577":40488,"36578":21714,"36579":21717,"36580":21721,"36581":23250,"36582":23748,"36583":24639,"36584":27546,"36585":27981,"36586":28904,"36587":29443,"36588":29423,"36589":30876,"36590":31405,"36591":32279,"36592":32539,"36593":33927,"36594":33640,"36595":33929,"36596":33630,"36597":33720,"36598":33431,"36599":34547,"36600":35816,"36601":35857,"36602":35860,"36603":35869,"36604":37072,"36605":38185,"36606":38188,"36672":38166,"36673":38167,"36674":38140,"36675":38171,"36676":38165,"36677":38174,"36678":38036,"36679":38415,"36680":38408,"36681":38409,"36682":38410,"36683":38412,"36684":38413,"36685":40498,"36686":40497,"36687":21724,"36688":24113,"36689":24697,"36690":25672,"36691":58305,"36692":27894,"36693":29461,"36694":29971,"36695":30213,"36696":30187,"36697":30807,"36698":31654,"36699":31578,"36700":31976,"36701":32545,"36702":32807,"36703":33631,"36704":33718,"36705":34544,"36706":35042,"36707":35279,"36708":35873,"36709":35788,"36710":35877,"36711":36292,"36712":38200,"36713":38196,"36714":38113,"36715":38198,"36716":38418,"36717":39271,"36718":40082,"36719":40085,"36720":40504,"36721":40505,"36722":40506,"36723":40832,"36724":24636,"36725":25669,"36726":25784,"36727":27898,"36728":30102,"36729":32523,"36730":32873,"36731":33641,"36732":34789,"36733":34414,"36734":35764,"36769":35881,"36770":36188,"36771":36157,"36772":36760,"36773":37021,"36774":38227,"36775":38112,"36776":38204,"36777":38223,"36778":34021,"36779":38890,"36780":39273,"36781":39568,"36782":39570,"36783":39571,"36784":38411,"36785":40105,"36786":40096,"36787":40520,"36788":40513,"36789":40518,"36790":21411,"36791":21590,"36792":22406,"36793":27104,"36794":26638,"36795":27655,"36796":27895,"36797":28486,"36798":31074,"36799":32562,"36800":32563,"36801":32628,"36802":33315,"36803":34511,"36804":34431,"36805":35043,"36806":35281,"36807":35311,"36808":35886,"36809":38235,"36810":38239,"36811":38250,"36812":38214,"36813":38121,"36814":38891,"36815":39073,"36816":39312,"36817":39618,"36818":40117,"36819":40118,"36820":40123,"36821":40113,"36822":40526,"36823":40491,"36824":40700,"36825":21950,"36826":25732,"36827":26634,"36828":26533,"36829":26636,"36830":32561,"36831":32845,"36832":33551,"36833":33480,"36834":34162,"36835":34548,"36836":34686,"36837":38132,"36838":38246,"36839":38248,"36840":38241,"36841":38243,"36842":38212,"36843":38251,"36844":38119,"36845":38244,"36846":38137,"36847":38426,"36848":39071,"36849":39316,"36850":39546,"36851":39581,"36852":39583,"36853":39576,"36854":40535,"36855":40538,"36856":40540,"36857":40838,"36858":40837,"36859":20649,"36860":23743,"36861":30152,"36862":25786,"36928":27017,"36929":28384,"36930":30779,"36931":31901,"36932":32425,"36933":32556,"36934":34105,"36935":36166,"36936":38257,"36937":38396,"36938":39129,"36939":39586,"36940":39574,"36941":39580,"36942":40101,"36943":40142,"36944":40144,"36945":40547,"36946":40536,"36947":40574,"36948":20865,"36949":23048,"36950":28757,"36951":25874,"36952":30271,"36953":31656,"36954":31860,"36955":33339,"36956":35276,"36957":36345,"36958":36318,"36959":36729,"36960":38228,"36961":38252,"36962":39587,"36963":39557,"36964":40149,"36965":40099,"36966":40102,"36967":40552,"36968":40503,"36969":40859,"36970":26686,"36971":26916,"36972":34016,"36973":38624,"36974":36723,"36975":40159,"36976":40095,"36977":40553,"36978":40556,"36979":40554,"36980":40555,"36981":40519,"36982":28751,"36983":31766,"36984":35888,"36985":39628,"36986":31550,"36987":31900,"36988":32565,"36989":33044,"36990":36479,"37025":38247,"37026":40090,"37027":36273,"37028":36508,"37029":37246,"37030":35891,"37031":39070,"37032":39079,"37033":39591,"37034":40492,"37035":25094,"37036":38404,"37037":40097,"37038":40514,"37039":31160,"37040":25300,"37041":36299,"37042":29648,"37043":23467,"37044":25296,"37045":27585,"37046":20943,"37047":31108,"37048":21525,"37049":28508,"37050":34972,"37051":37095,"37052":20857,"37053":25144,"37054":25243,"37055":25383,"37056":25531,"37057":25566,"37058":25594,"37059":25745,"37060":25792,"37061":25825,"37062":25846,"37063":25861,"37064":25909,"37065":25934,"37066":25963,"37067":25992,"37068":26073,"37069":26142,"37070":26171,"37071":26175,"37072":26180,"37073":26199,"37074":26217,"37075":26227,"37076":26243,"37077":26300,"37078":26303,"37079":26305,"37080":26357,"37081":26362,"37082":26363,"37083":26382,"37084":26390,"37085":26423,"37086":26468,"37087":26470,"37088":26534,"37089":26535,"37090":26537,"37091":26619,"37092":26621,"37093":26624,"37094":26625,"37095":26629,"37096":26654,"37097":26698,"37098":26706,"37099":26709,"37100":26713,"37101":26765,"37102":26809,"37103":26831,"37104":20616,"37105":38184,"37106":40087,"37107":26914,"37108":26918,"37109":220,"37110":58591,"37111":58592,"37112":252,"37113":58594,"37114":58595,"37115":220,"37116":252,"37117":26934,"37118":26977,"37184":33477,"37185":33482,"37186":33496,"37187":33560,"37188":33562,"37189":33571,"37190":33606,"37191":33627,"37192":33634,"37193":33644,"37194":33646,"37195":33692,"37196":33695,"37197":33717,"37198":33724,"37199":33783,"37200":33834,"37201":33864,"37202":33884,"37203":33890,"37204":33924,"37205":33928,"37206":34012,"37207":34019,"37208":34104,"37209":34138,"37210":34199,"37211":34219,"37212":34241,"37213":34323,"37214":34326,"37215":8715,"37216":34581,"37217":34672,"37218":34685,"37219":34699,"37220":34728,"37221":34759,"37222":34768,"37223":34823,"37224":34830,"37225":34855,"37226":34990,"37227":8712,"37228":34997,"37229":35007,"37230":35045,"37231":35061,"37232":35100,"37233":35101,"37234":35191,"37235":35303,"37236":35383,"37237":35500,"37238":35546,"37239":35675,"37240":35697,"37241":35883,"37242":35898,"37243":35964,"37244":35982,"37245":36014,"37246":36114,"37281":36169,"37282":36173,"37283":36209,"37284":36360,"37285":36410,"37286":36464,"37287":36505,"37288":36528,"37289":36529,"37290":36549,"37291":36550,"37292":36558,"37293":36579,"37294":36620,"37295":36721,"37296":36727,"37297":36775,"37298":36847,"37299":36878,"37300":36921,"37301":36965,"37302":37001,"37303":37086,"37304":37141,"37305":37334,"37306":37339,"37307":37342,"37308":37345,"37309":37349,"37310":37366,"37311":37372,"37312":37417,"37313":37420,"37314":65287,"37315":37465,"37316":37495,"37317":37613,"37318":37690,"37319":58701,"37320":58702,"37321":29227,"37322":20866,"37323":20886,"37324":20023,"37325":20843,"37326":20799,"37327":58709,"37328":58710,"37329":26409,"37330":27706,"37331":21378,"37332":30098,"37333":32896,"37334":34916,"37335":19974,"37336":58718,"37337":58719,"37338":58720,"37339":11927,"37340":21241,"37341":21269,"37342":8225,"37343":58725,"37344":13316,"37345":58727,"37346":58728,"37347":58729,"37348":58730,"37349":58731,"37350":20981,"37351":58733,"37352":23662,"37353":58735,"37354":22231,"37355":20128,"37356":20907,"37357":11904,"37358":27079,"37359":58741,"37360":9550,"37361":9688,"37362":9689,"37363":9794,"37364":9654,"37365":9668,"37366":8597,"37367":8252,"37368":182,"37369":8704,"37370":8616,"37371":8596,"37372":8962,"37373":58755,"37374":58756,"37440":20124,"37441":24746,"37442":22311,"37443":22258,"37444":21307,"37445":22769,"37446":36920,"37447":38560,"37448":26628,"37449":21942,"37450":39365,"37451":35585,"37452":20870,"37453":32257,"37454":24540,"37455":27431,"37456":27572,"37457":26716,"37458":22885,"37459":31311,"37460":20206,"37461":20385,"37462":30011,"37463":28784,"37464":20250,"37465":24724,"37466":28023,"37467":32117,"37468":22730,"37469":25040,"37470":25313,"37471":27579,"37472":35226,"37473":23398,"37474":27005,"37475":21917,"37476":28167,"37477":58794,"37478":24059,"37479":38501,"37480":21223,"37481":23515,"37482":28450,"37483":38306,"37484":27475,"37485":35251,"37486":27671,"37487":24112,"37488":25135,"37489":29344,"37490":34384,"37491":26087,"37492":24613,"37493":25312,"37494":25369,"37495":34394,"37496":23777,"37497":25375,"37498":29421,"37499":37111,"37500":38911,"37501":26241,"37502":21220,"37537":35641,"37538":21306,"37539":39366,"37540":21234,"37541":58824,"37542":24452,"37543":33550,"37544":24693,"37545":25522,"37546":28179,"37547":32076,"37548":34509,"37549":36605,"37550":32153,"37551":40335,"37552":25731,"37553":30476,"37554":20537,"37555":21091,"37556":38522,"37557":22287,"37558":26908,"37559":27177,"37560":38997,"37561":39443,"37562":21427,"37563":21577,"37564":23087,"37565":35492,"37566":24195,"37567":28207,"37568":37489,"37569":21495,"37570":22269,"37571":40658,"37572":31296,"37573":30741,"37574":28168,"37575":25998,"37576":27507,"37577":21092,"37578":38609,"37579":21442,"37580":26719,"37581":24808,"37582":36059,"37583":27531,"37584":27503,"37585":20816,"37586":36766,"37587":28287,"37588":23455,"37589":20889,"37590":33294,"37591":25448,"37592":37320,"37593":23551,"37594":21454,"37595":34886,"37596":24467,"37597":28171,"37598":29539,"37599":32294,"37600":31899,"37601":20966,"37602":23558,"37603":31216,"37604":28169,"37605":28988,"37606":22888,"37607":26465,"37608":29366,"37609":20055,"37610":27972,"37611":21104,"37612":30067,"37613":32260,"37614":22732,"37615":23330,"37616":35698,"37617":37304,"37618":35302,"37619":22065,"37620":23517,"37621":23613,"37622":22259,"37623":31883,"37624":37204,"37625":31298,"37626":38543,"37627":39620,"37628":26530,"37629":25968,"37630":25454,"37696":28716,"37697":22768,"37698":25993,"37699":38745,"37700":31363,"37701":25666,"37702":32118,"37703":23554,"37704":27973,"37705":25126,"37706":36341,"37707":37549,"37708":28508,"37709":36983,"37710":36984,"37711":32330,"37712":31109,"37713":30094,"37714":22766,"37715":20105,"37716":33624,"37717":25436,"37718":25407,"37719":24035,"37720":31379,"37721":35013,"37722":20711,"37723":23652,"37724":32207,"37725":39442,"37726":22679,"37727":24974,"37728":34101,"37729":36104,"37730":33235,"37731":23646,"37732":32154,"37733":22549,"37734":23550,"37735":24111,"37736":28382,"37737":28381,"37738":25246,"37739":27810,"37740":28655,"37741":21336,"37742":22022,"37743":22243,"37744":26029,"37745":24382,"37746":36933,"37747":26172,"37748":37619,"37749":24193,"37750":24500,"37751":32884,"37752":25074,"37753":22618,"37754":36883,"37755":37444,"37756":28857,"37757":36578,"37758":20253,"37793":38651,"37794":28783,"37795":24403,"37796":20826,"37797":30423,"37798":31282,"37799":38360,"37800":24499,"37801":27602,"37802":29420,"37803":35501,"37804":23626,"37805":38627,"37806":24336,"37807":24745,"37808":33075,"37809":25309,"37810":24259,"37811":22770,"37812":26757,"37813":21338,"37814":34180,"37815":40614,"37816":32283,"37817":30330,"37818":39658,"37819":25244,"37820":27996,"37821":27996,"37822":25935,"37823":25975,"37824":20398,"37825":25173,"37826":20175,"37827":36794,"37828":22793,"37829":27497,"37830":33303,"37831":31807,"37832":21253,"37833":23453,"37834":25265,"37835":27873,"37836":32990,"37837":30770,"37838":35914,"37839":39165,"37840":22696,"37841":27598,"37842":28288,"37843":33032,"37844":40665,"37845":35379,"37846":34220,"37847":36493,"37848":19982,"37849":35465,"37850":25671,"37851":27096,"37852":35617,"37853":26332,"37854":26469,"37855":38972,"37856":20081,"37857":35239,"37858":31452,"37859":38534,"37860":26053,"37861":20001,"37862":29471,"37863":32209,"37864":28057,"37865":22593,"37866":31036,"37867":21169,"37868":25147,"37869":38666,"37870":40802,"37871":26278,"37872":27508,"37873":24651,"37874":32244,"37875":37676,"37876":28809,"37877":21172,"37878":27004,"37879":37682,"37880":28286,"37881":24357,"37882":20096,"37883":26365,"37884":22985,"37885":23437,"37886":23947,"37952":27179,"37953":26907,"37954":21936,"37955":31874,"37956":36796,"37957":27018,"37958":21682,"37959":40235,"37960":38635,"37961":26905,"37962":25539,"37963":39364,"37964":20967,"37965":26626,"37966":36795,"37967":20685,"37968":23776,"37969":26627,"37970":20970,"37971":21250,"37972":30834,"37973":30033,"37974":30048,"37975":22138,"37976":37618,"37977":22592,"37978":26622,"37979":20451,"37980":26466,"37981":31870,"37982":21249,"37983":20452,"37984":20453,"37985":20969,"37986":21498,"37987":21720,"37988":22222,"37989":22310,"37990":22327,"37991":22328,"37992":22408,"37993":22451,"37994":22442,"37995":22448,"37996":22486,"37997":22640,"37998":22713,"37999":22743,"38000":23670,"38001":23740,"38002":23749,"38003":23742,"38004":23926,"38005":24342,"38006":24634,"38007":25525,"38008":26433,"38009":26467,"38010":26529,"38011":26810,"38012":26917,"38013":26920,"38014":27258,"38049":26915,"38050":26913,"38051":27006,"38052":27009,"38053":27101,"38054":27182,"38055":27250,"38056":27423,"38057":27615,"38058":28181,"38059":29077,"38060":29927,"38061":29938,"38062":29936,"38063":29937,"38064":29944,"38065":29957,"38066":30057,"38067":30314,"38068":30836,"38069":31437,"38070":31439,"38071":31445,"38072":31443,"38073":31457,"38074":31472,"38075":31490,"38076":31763,"38077":31767,"38078":31888,"38079":31917,"38080":31936,"38081":31960,"38082":32155,"38083":32261,"38084":32359,"38085":32387,"38086":32400,"38087":33188,"38088":33373,"38089":33826,"38090":34009,"38091":34352,"38092":34475,"38093":34543,"38094":34992,"38095":35011,"38096":35012,"38097":35076,"38098":59183,"38099":36542,"38100":36552,"38101":36684,"38102":36791,"38103":36826,"38104":36903,"38105":36950,"38106":37685,"38107":37691,"38108":37817,"38109":38282,"38110":38294,"38111":38777,"38112":38790,"38113":38800,"38114":39082,"38115":39830,"38116":39831,"38117":39860,"38118":39887,"38119":39889,"38120":39890,"38121":39922,"38122":39921,"38123":39984,"38124":40007,"38125":40026,"38126":40176,"38127":40262,"38128":40292,"38129":40363,"38130":20036,"38131":21583,"38132":25368,"38133":39857,"38134":40041,"38135":40263,"38136":40293,"38137":39983,"38138":40639,"38139":20916,"38140":21610,"38141":26528,"38142":39822,"38208":37032,"38209":20914,"38210":13869,"38211":25285,"38212":21189,"38213":26545,"38214":21709,"38215":24658,"38216":21441,"38217":28913,"38218":22531,"38219":21855,"38220":37390,"38221":30528,"38222":29756,"38223":29002,"38224":28377,"38225":21472,"38226":29486,"38227":35023,"38228":30861,"38229":32675,"38230":32171,"38231":36394,"38232":37979,"38233":25452,"38234":24487,"38235":23557,"38236":32827,"38237":23791,"38238":14776,"38239":29009,"38240":36045,"38241":38894,"38242":22642,"38243":23139,"38244":32632,"38245":23895,"38246":24943,"38247":27032,"38248":32137,"38249":31918,"38250":32179,"38251":28545,"38252":23290,"38253":22715,"38254":29269,"38255":30286,"38256":36653,"38257":37561,"38258":40286,"38259":40623,"38260":32583,"38261":40388,"38262":36120,"38263":20915,"38264":34412,"38265":21668,"38266":21414,"38267":21030,"38268":26422,"38269":20001,"38270":21364,"38305":24313,"38306":21177,"38307":21647,"38308":24312,"38309":22956,"38310":24625,"38311":29248,"38312":33047,"38313":30267,"38314":24333,"38315":26187,"38316":26280,"38317":24932,"38318":25423,"38319":28895,"38320":27940,"38321":31911,"38322":31945,"38323":21465,"38324":25933,"38325":22338,"38326":29647,"38327":32966,"38328":13649,"38329":27445,"38330":30849,"38331":21452,"38332":29483,"38333":29482,"38334":29641,"38335":30026,"38336":23033,"38337":29124,"38338":29966,"38339":32220,"38340":39393,"38341":35241,"38342":28662,"38343":14935,"38344":25834,"38345":15341,"38346":27809,"38347":28284,"38348":30055,"38349":22633,"38350":22633,"38351":20996,"38352":59338,"38353":24967,"38354":25658,"38355":33263,"38356":59342,"38357":20917,"38358":20945,"38359":27769,"38360":22815,"38361":36857,"38362":39153,"38363":25911,"38364":33033,"38365":34996,"38366":14890,"38367":36525,"38368":32663,"38369":39440,"38370":32037,"38371":27336,"38372":20876,"38373":21031,"38374":59360,"38375":33050,"38376":21408,"38377":21410,"38378":27738,"38379":27703,"38380":33304,"38381":21894,"38382":24315,"38383":20937,"38384":30897,"38385":37474,"38386":21357,"38387":20931,"38388":59374,"38389":33905,"38390":35207,"38391":38765,"38392":35728,"38393":38563,"38394":24316,"38395":38583,"38396":20814,"38397":39952,"38398":26160,"38464":37461,"38465":30728,"38466":37701,"38467":37491,"38468":37737,"38469":59390,"38470":59391,"38471":59392,"38472":59393,"38473":37343,"38474":37338,"38475":30804,"38476":30822,"38477":30856,"38478":30902,"38479":30919,"38480":30930,"38481":30935,"38482":8491,"38483":8651,"38484":30948,"38485":30958,"38486":30960,"38487":30961,"38488":30965,"38489":31026,"38490":31027,"38491":31030,"38492":31064,"38493":12307,"38494":31065,"38495":31089,"38496":31102,"38497":31107,"38498":31110,"38499":31111,"38500":31121,"38501":31129,"38502":31135,"38503":31141,"38504":31202,"38505":31217,"38506":31220,"38507":31274,"38508":31290,"38509":31301,"38510":31333,"38511":31420,"38512":31426,"38513":31433,"38514":31451,"38515":31465,"38516":31486,"38517":31500,"38518":31527,"38519":31529,"38520":31554,"38521":31555,"38522":31573,"38523":31599,"38524":31666,"38525":27102,"38526":27129,"38561":37238,"38562":33114,"38563":33527,"38564":21579,"38565":33074,"38566":32957,"38567":33816,"38568":37214,"38569":37232,"38570":37260,"38571":33096,"38572":59459,"38573":17462,"38574":33113,"38575":32927,"38576":59463,"38577":21833,"38578":21537,"38579":21722,"38580":21554,"38581":21945,"38582":21652,"38583":59470,"38584":30802,"38585":30789,"38586":30796,"38587":59474,"38588":33981,"38589":33820,"38590":33476,"38591":59478,"38592":33915,"38593":35629,"38594":59481,"38595":22347,"38596":59483,"38597":59484,"38598":22341,"38599":34766,"38600":22112,"38601":21994,"38602":22139,"38603":32956,"38604":59491,"38605":30904,"38606":27148,"38607":21708,"38608":31696,"38609":31724,"38610":31738,"38611":31765,"38612":31771,"38613":31797,"38614":31812,"38615":31853,"38616":31886,"38617":31928,"38618":31939,"38619":31974,"38620":31981,"38621":31987,"38622":31989,"38623":31993,"38624":59511,"38625":31996,"38626":32139,"38627":32151,"38628":32164,"38629":32168,"38630":32205,"38631":32208,"38632":32211,"38633":32229,"38634":32253,"38635":27154,"38636":27170,"38637":27184,"38638":27190,"38639":27237,"38640":59527,"38641":59528,"38642":59529,"38643":59530,"38644":59531,"38645":59532,"38646":59533,"38647":59534,"38648":27251,"38649":27256,"38650":59537,"38651":59538,"38652":27260,"38653":27305,"38654":27306,"38720":9450,"38721":9312,"38722":9313,"38723":9314,"38724":9315,"38725":9316,"38726":9317,"38727":9318,"38728":9319,"38729":9320,"38730":9321,"38731":9322,"38732":9323,"38733":9324,"38734":9325,"38735":9326,"38736":9327,"38737":9328,"38738":9329,"38739":9330,"38740":9331,"38741":37700,"38742":37805,"38743":37830,"38744":37861,"38745":37914,"38746":37921,"38747":37950,"38748":37953,"38749":37971,"38750":37978,"38751":38042,"38752":38071,"38753":38104,"38754":38110,"38755":38131,"38756":38147,"38757":38158,"38758":38159,"38759":38168,"38760":38173,"38761":38186,"38762":38187,"38763":38207,"38764":38213,"38765":38222,"38766":38242,"38767":38245,"38768":38249,"38769":38258,"38770":38279,"38771":38297,"38772":38304,"38773":38322,"38774":38502,"38775":38557,"38776":38575,"38777":38578,"38778":38707,"38779":38715,"38780":38733,"38781":38735,"38782":38737,"38817":38741,"38818":38756,"38819":38763,"38820":38769,"38821":38802,"38822":38834,"38823":38898,"38824":38973,"38825":38996,"38826":39077,"38827":39107,"38828":39130,"38829":39150,"38830":39197,"38831":39200,"38832":39267,"38833":39296,"38834":39303,"38835":39309,"38836":39315,"38837":39317,"38838":39356,"38839":39368,"38840":39410,"38841":39606,"38842":39641,"38843":39646,"38844":39695,"38845":39753,"38846":39794,"38847":39811,"38848":39839,"38849":39867,"38850":39907,"38851":39925,"38852":39936,"38853":39940,"38854":39963,"38855":9398,"38856":9399,"38857":9400,"38858":9401,"38859":9402,"38860":9403,"38861":9404,"38862":9405,"38863":9406,"38864":9407,"38865":9408,"38866":9409,"38867":9410,"38868":9411,"38869":9412,"38870":9413,"38871":9414,"38872":9415,"38873":9416,"38874":9417,"38875":9418,"38876":9419,"38877":9420,"38878":9421,"38879":9422,"38880":9423,"38881":9424,"38882":9425,"38883":9426,"38884":9427,"38885":9428,"38886":9429,"38887":9430,"38888":9431,"38889":9432,"38890":9433,"38891":9434,"38892":9435,"38893":9436,"38894":9437,"38895":9438,"38896":9439,"38897":9440,"38898":9441,"38899":9442,"38900":9443,"38901":9444,"38902":9445,"38903":9446,"38904":9447,"38905":9448,"38906":9449,"38907":174,"38908":8482,"38909":59697,"38910":59698,"38976":40054,"38977":10122,"38978":10123,"38979":10124,"38980":10125,"38981":10126,"38982":10127,"38983":10128,"38984":10129,"38985":10130,"38986":10131,"38987":40069,"38988":40070,"38989":40071,"38990":40075,"38991":40080,"38992":40094,"38993":40110,"38994":40112,"38995":40114,"38996":40116,"38997":40122,"38998":40124,"38999":40125,"39000":40134,"39001":40135,"39002":40138,"39003":40139,"39004":40147,"39005":40152,"39006":40153,"39007":40162,"39008":40171,"39009":40172,"39010":40234,"39011":40264,"39012":40272,"39013":40314,"39014":40390,"39015":40523,"39016":40533,"39017":40539,"39018":40561,"39019":40618,"39020":40637,"39021":40644,"39022":40674,"39023":40682,"39024":40712,"39025":40715,"39026":40717,"39027":40737,"39028":40772,"39029":40785,"39030":40861,"39031":64014,"39032":64015,"39033":64017,"39034":64019,"39035":64020,"39036":64024,"39037":64031,"39038":64032,"39073":64033,"39074":64035,"39075":64036,"39076":64039,"39077":64040,"39078":64041,"39079":19972,"39080":20015,"39081":20097,"39082":20103,"39083":20131,"39084":20151,"39085":20156,"39086":20216,"39087":20264,"39088":20265,"39089":20279,"39090":20290,"39091":20293,"39092":20299,"39093":20338,"39094":20386,"39095":20400,"39096":20413,"39097":20424,"39098":20428,"39099":20464,"39100":20466,"39101":20473,"39102":20483,"39103":20488,"39104":20532,"39105":20539,"39106":20568,"39107":20582,"39108":20609,"39109":20624,"39110":20668,"39111":20688,"39112":20703,"39113":20705,"39114":20732,"39115":20749,"39116":20779,"39117":20832,"39118":20910,"39119":20920,"39120":20946,"39121":20962,"39122":20997,"39123":21044,"39124":21052,"39125":21081,"39126":21096,"39127":21113,"39128":21156,"39129":21196,"39130":21287,"39131":21314,"39132":21341,"39133":21373,"39134":21374,"39135":21445,"39136":21456,"39137":21458,"39138":21502,"39139":21613,"39140":21637,"39141":21651,"39142":21662,"39143":21689,"39144":21731,"39145":21743,"39146":21773,"39147":21784,"39148":21797,"39149":21800,"39150":21803,"39151":21831,"39152":21881,"39153":21904,"39154":21940,"39155":21953,"39156":21975,"39157":21976,"39158":22011,"39159":20404,"39160":22049,"39161":8707,"39162":22098,"39163":59852,"39164":9787,"39165":59854,"39166":59855,"39232":22109,"39233":9332,"39234":9333,"39235":9334,"39236":9335,"39237":9336,"39238":9337,"39239":9338,"39240":9339,"39241":9340,"39242":9341,"39243":9342,"39244":9343,"39245":9344,"39246":9345,"39247":9346,"39248":9347,"39249":9348,"39250":9349,"39251":9350,"39252":9351,"39253":22113,"39254":22153,"39255":22155,"39256":22174,"39257":22177,"39258":22193,"39259":22201,"39260":22207,"39261":22230,"39262":22255,"39263":22293,"39264":22301,"39265":22322,"39266":22333,"39267":22335,"39268":22339,"39269":8660,"39270":22398,"39271":22410,"39272":22413,"39273":22416,"39274":22428,"39275":22459,"39276":22462,"39277":22468,"39278":22494,"39279":22526,"39280":22546,"39281":22562,"39282":22599,"39283":22620,"39284":22623,"39285":22643,"39286":22695,"39287":22698,"39288":22704,"39289":22709,"39290":22710,"39291":22731,"39292":22736,"39293":22752,"39294":22789,"39329":22801,"39330":22921,"39331":22932,"39332":22938,"39333":22943,"39334":22960,"39335":22968,"39336":22980,"39337":23023,"39338":23024,"39339":23032,"39340":23042,"39341":23051,"39342":23053,"39343":23058,"39344":23073,"39345":23076,"39346":23079,"39347":23082,"39348":23083,"39349":23084,"39350":23101,"39351":23109,"39352":23124,"39353":23129,"39354":23137,"39355":23144,"39356":23147,"39357":23150,"39358":23153,"39359":23161,"39360":23166,"39361":23169,"39362":23170,"39363":23174,"39364":23176,"39365":23185,"39366":23193,"39367":23200,"39368":23201,"39369":23211,"39370":23235,"39371":23246,"39372":23247,"39373":23251,"39374":23268,"39375":23280,"39376":23294,"39377":23309,"39378":23313,"39379":23317,"39380":23327,"39381":23339,"39382":23361,"39383":23364,"39384":23366,"39385":23370,"39386":23375,"39387":23400,"39388":23412,"39389":23414,"39390":23420,"39391":23426,"39392":23440,"39393":9372,"39394":9373,"39395":9374,"39396":9375,"39397":9376,"39398":9377,"39399":9378,"39400":9379,"39401":9380,"39402":9381,"39403":9382,"39404":9383,"39405":9384,"39406":9385,"39407":9386,"39408":9387,"39409":9388,"39410":9389,"39411":9390,"39412":9391,"39413":9392,"39414":9393,"39415":9394,"39416":9395,"39417":9396,"39418":9397,"39419":60009,"39420":12850,"39421":12849,"39422":27307,"39488":23446,"39489":9352,"39490":9353,"39491":9354,"39492":9355,"39493":9356,"39494":9357,"39495":9358,"39496":9359,"39497":9360,"39498":9361,"39499":9362,"39500":9363,"39501":9364,"39502":9365,"39503":9366,"39504":9367,"39505":9368,"39506":9369,"39507":9370,"39508":9371,"39509":23509,"39510":23511,"39511":23587,"39512":23685,"39513":23710,"39514":23746,"39515":23824,"39516":23852,"39517":23855,"39518":23880,"39519":23894,"39520":23920,"39521":23931,"39522":23941,"39523":23972,"39524":23979,"39525":23990,"39526":24001,"39527":24023,"39528":24073,"39529":24136,"39530":24210,"39531":24253,"39532":24334,"39533":24434,"39534":24497,"39535":24514,"39536":24539,"39537":24543,"39538":24611,"39539":24702,"39540":24791,"39541":24839,"39542":24844,"39543":24857,"39544":24866,"39545":24912,"39546":24928,"39547":24961,"39548":24981,"39549":25017,"39550":25024,"39585":25039,"39586":25043,"39587":25050,"39588":25232,"39589":25393,"39590":8835,"39591":25399,"39592":25465,"39593":25483,"39594":25537,"39595":25570,"39596":25574,"39597":25595,"39598":25598,"39599":25607,"39600":25650,"39601":25656,"39602":25659,"39603":25690,"39604":25713,"39605":25724,"39606":25741,"39607":25775,"39608":25780,"39609":25782,"39610":25821,"39611":25829,"39612":25866,"39613":25873,"39614":25887,"39615":25951,"39616":25965,"39617":25990,"39618":26037,"39619":26046,"39620":26065,"39621":26068,"39622":26083,"39623":26111,"39624":26136,"39625":26147,"39626":26211,"39627":26219,"39628":26237,"39629":26245,"39630":26258,"39631":26266,"39632":26276,"39633":26285,"39634":26291,"39635":26294,"39636":26317,"39637":26318,"39638":26370,"39639":26380,"39640":26393,"39641":26436,"39642":26475,"39643":26511,"39644":26532,"39645":26559,"39646":26582,"39647":26583,"39648":8834,"39649":26637,"39650":26640,"39651":26651,"39652":26678,"39653":26695,"39654":26710,"39655":26756,"39656":26760,"39657":26813,"39658":26819,"39659":26821,"39660":26882,"39661":26883,"39662":26889,"39663":26904,"39664":26947,"39665":26950,"39666":26980,"39667":26983,"39668":26994,"39669":27013,"39670":27039,"39671":27042,"39672":27089,"39673":27093,"39674":27094,"39675":39457,"39676":39462,"39677":39471,"39678":27329,"39744":22975,"39745":27105,"39746":27139,"39747":27162,"39748":27164,"39749":27180,"39750":27181,"39751":27187,"39752":27203,"39753":27205,"39754":27212,"39755":27219,"39756":27223,"39757":27235,"39758":27252,"39759":27266,"39760":27274,"39761":27279,"39762":27289,"39763":27303,"39764":27313,"39765":27317,"39766":27326,"39767":27337,"39768":27348,"39769":27352,"39770":27382,"39771":27479,"39772":27514,"39773":27612,"39774":27676,"39775":27697,"39776":27736,"39777":27758,"39778":27765,"39779":27775,"39780":27823,"39781":27851,"39782":27871,"39783":27903,"39784":27906,"39785":27909,"39786":27910,"39787":27942,"39788":27991,"39789":27995,"39790":28017,"39791":28033,"39792":28047,"39793":28069,"39794":28081,"39795":28158,"39796":28162,"39797":28164,"39798":28175,"39799":28184,"39800":28202,"39801":28240,"39802":28249,"39803":28314,"39804":28341,"39805":28344,"39806":28379,"39841":28410,"39842":28420,"39843":28427,"39844":28428,"39845":28438,"39846":28439,"39847":28468,"39848":28477,"39849":28502,"39850":28537,"39851":28554,"39852":28573,"39853":28575,"39854":28603,"39855":28606,"39856":28627,"39857":28633,"39858":28664,"39859":28675,"39860":28747,"39861":28749,"39862":28752,"39863":28756,"39864":28764,"39865":28775,"39866":28791,"39867":28793,"39868":28811,"39869":28815,"39870":28832,"39871":28835,"39872":28837,"39873":28838,"39874":28839,"39875":28868,"39876":28876,"39877":28880,"39878":28886,"39879":618,"39880":603,"39881":230,"39882":652,"39883":593,"39884":596,"39885":650,"39886":605,"39887":601,"39888":602,"39889":604,"39890":609,"39891":7747,"39892":7753,"39893":330,"39894":7739,"39895":629,"39896":240,"39897":643,"39898":658,"39899":679,"39900":676,"39901":227,"39902":60294,"39903":60295,"39904":623,"39905":632,"39906":647,"39907":60299,"39908":199,"39909":339,"39910":594,"39911":65351,"39912":715,"39913":719,"39914":65345,"39915":65346,"39916":65348,"39917":65349,"39918":65350,"39919":65352,"39920":65353,"39921":65354,"39922":65355,"39923":65356,"39924":65357,"39925":65358,"39926":65359,"39927":65360,"39928":65362,"39929":65363,"39930":65364,"39931":65365,"39932":65366,"39933":65367,"39934":65370,"40000":28917,"40001":12832,"40002":12833,"40003":12834,"40004":12835,"40005":12836,"40006":12837,"40007":12838,"40008":12839,"40009":12840,"40010":12841,"40011":28926,"40012":28933,"40013":28957,"40014":28969,"40015":28971,"40016":28972,"40017":28979,"40018":28981,"40019":28987,"40020":28990,"40021":28992,"40022":29007,"40023":29035,"40024":29045,"40025":29047,"40026":29052,"40027":29054,"40028":29068,"40029":29070,"40030":29073,"40031":29078,"40032":29090,"40033":29091,"40034":29101,"40035":29108,"40036":29111,"40037":29114,"40038":29137,"40039":29149,"40040":29163,"40041":29184,"40042":29193,"40043":29198,"40044":29199,"40045":29206,"40046":29207,"40047":29220,"40048":23204,"40049":29230,"40050":8838,"40051":29271,"40052":29276,"40053":29332,"40054":29444,"40055":29456,"40056":29505,"40057":29556,"40058":29580,"40059":29583,"40060":29592,"40061":29596,"40062":29598,"40097":29607,"40098":29610,"40099":29653,"40100":29665,"40101":29666,"40102":29668,"40103":29670,"40104":29679,"40105":29683,"40106":8839,"40107":29689,"40108":29691,"40109":29698,"40110":29713,"40111":29714,"40112":29716,"40113":29717,"40114":29719,"40115":29721,"40116":29724,"40117":29726,"40118":29727,"40119":29751,"40120":29752,"40121":29753,"40122":29763,"40123":29765,"40124":29767,"40125":29768,"40126":29769,"40127":29779,"40128":29782,"40129":29797,"40130":29803,"40131":29804,"40132":29812,"40133":29818,"40134":29826,"40135":21378,"40136":24191,"40137":20008,"40138":24186,"40139":20886,"40140":23424,"40141":21353,"40142":11911,"40143":60436,"40144":21251,"40145":9746,"40146":33401,"40147":17553,"40148":11916,"40149":11914,"40150":20022,"40151":60444,"40152":21274,"40153":60446,"40154":60447,"40155":11925,"40156":60449,"40157":60450,"40158":9492,"40159":20058,"40160":36790,"40161":24308,"40162":20872,"40163":20101,"40164":60457,"40165":20031,"40166":60459,"40167":60460,"40168":20059,"40169":21430,"40170":36710,"40171":32415,"40172":35744,"40173":36125,"40174":40479,"40175":38376,"40176":38021,"40177":38429,"40178":25164,"40179":27701,"40180":20155,"40181":24516,"40182":28780,"40183":11950,"40184":21475,"40185":27362,"40186":39483,"40187":39484,"40188":39512,"40189":39516,"40190":39523,"40256":9742,"40257":8594,"40258":8592,"40259":8593,"40260":8595,"40261":8680,"40262":8678,"40263":8679,"40264":8681,"40265":8680,"40266":8678,"40267":8679,"40268":8681,"40269":9758,"40270":9756,"40271":9755,"40272":9759,"40273":12310,"40274":12311,"40275":9675,"40276":10005,"40277":10003,"40278":22267,"40279":9789,"40280":22813,"40281":26189,"40282":29221,"40283":10025,"40284":10017,"40285":9786,"40286":9785,"40287":60515,"40288":60516,"40289":60517,"40290":60518,"40291":60519,"40292":23672,"40293":9836,"40294":9834,"40295":23249,"40296":23479,"40297":23804,"40298":60526,"40299":9993,"40300":9986,"40301":60529,"40302":60530,"40303":60531,"40304":60532,"40305":23765,"40306":26478,"40307":29793,"40308":29853,"40309":32595,"40310":34195,"40311":10063,"40312":60540,"40313":60541,"40314":23928,"40315":24379,"40316":60544,"40317":9473,"40318":9475,"40353":60547,"40354":60548,"40355":60549,"40356":60550,"40357":60551,"40358":60552,"40359":60553,"40360":60554,"40361":60555,"40362":60556,"40363":60557,"40364":60558,"40365":60559,"40366":60560,"40367":60561,"40368":39602,"40369":39648,"40370":39700,"40371":39732,"40372":39737,"40373":39744,"40374":39760,"40375":39807,"40376":9788,"40377":32149,"40378":9729,"40379":38708,"40380":9730,"40381":60575,"40382":60576,"40383":60577,"40384":9992,"40385":60579,"40386":60580,"40387":60581,"40388":60582,"40389":60583,"40390":60584,"40391":60585,"40392":8507,"40393":8481,"40394":26343,"40395":28247,"40396":60590,"40397":29015,"40398":31178,"40399":8470,"40400":33132,"40401":35577,"40402":38998,"40403":60597,"40404":60598,"40405":9760,"40406":60600,"40407":9828,"40408":9824,"40409":9831,"40410":9827,"40411":9826,"40412":9830,"40413":9825,"40414":9829,"40415":60609,"40416":60610,"40417":27364,"40418":8478,"40419":13250,"40420":13272,"40421":13217,"40422":60616,"40423":13221,"40424":60618,"40425":60619,"40426":60620,"40427":60621,"40428":60622,"40429":9745,"40430":39809,"40431":39819,"40432":39821,"40433":39901,"40434":39913,"40435":39917,"40436":39924,"40437":39967,"40438":39968,"40439":39974,"40440":40019,"40441":40029,"40442":40059,"40443":40204,"40444":40214,"40445":8626,"40446":27397,"40512":36073,"40513":36082,"40514":36099,"40515":36113,"40516":36124,"40517":36218,"40518":36265,"40519":36288,"40520":36353,"40521":36366,"40522":36422,"40523":36456,"40524":36465,"40525":36478,"40526":36480,"40527":36534,"40528":36537,"40529":36540,"40530":36547,"40531":36580,"40532":36589,"40533":36594,"40534":36656,"40535":36673,"40536":36682,"40537":36773,"40538":36787,"40539":36792,"40540":36810,"40541":36815,"40542":36872,"40543":36915,"40544":36919,"40545":36964,"40546":36972,"40547":37289,"40548":37302,"40549":37316,"40550":37370,"40551":37384,"40552":37395,"40553":37409,"40554":37416,"40555":37419,"40556":37429,"40557":37436,"40558":37441,"40559":37464,"40560":37469,"40561":37471,"40562":37483,"40563":37486,"40564":37505,"40565":37508,"40566":37513,"40567":37519,"40568":37553,"40569":37562,"40570":37567,"40571":37588,"40572":37595,"40573":37603,"40574":37605,"40609":37611,"40610":37612,"40611":37620,"40612":37622,"40613":37629,"40614":37635,"40615":37639,"40616":37680,"40617":37681,"40618":37696,"40619":37698,"40620":37699,"40621":37727,"40622":37730,"40623":37734,"40624":37736,"40625":37747,"40626":37748,"40627":37752,"40628":37757,"40629":37761,"40630":37764,"40631":37766,"40632":37767,"40633":37776,"40634":37788,"40635":37792,"40636":37816,"40637":37819,"40638":37821,"40639":37823,"40640":37835,"40641":37843,"40642":37851,"40643":37856,"40644":37872,"40645":37873,"40646":37875,"40647":37876,"40648":37889,"40649":37892,"40650":37896,"40651":37911,"40652":37915,"40653":37917,"40654":37924,"40655":37925,"40656":37926,"40657":37933,"40658":37954,"40659":37955,"40660":37965,"40661":37972,"40662":37976,"40663":37989,"40664":37991,"40665":37996,"40666":38009,"40667":38011,"40668":38264,"40669":38277,"40670":38310,"40671":38314,"40672":38486,"40673":38523,"40674":38565,"40675":38644,"40676":38683,"40677":38710,"40678":38720,"40679":38721,"40680":38743,"40681":38791,"40682":38793,"40683":38811,"40684":38833,"40685":38845,"40686":38848,"40687":38850,"40688":38866,"40689":38880,"40690":38932,"40691":38933,"40692":38947,"40693":38963,"40694":39016,"40695":39095,"40696":39097,"40697":39111,"40698":39114,"40699":39136,"40700":39137,"40701":39148,"40702":39157,"40768":40225,"40769":40244,"40770":40249,"40771":40265,"40772":40270,"40773":40301,"40774":8759,"40775":40302,"40776":40316,"40777":40323,"40778":40339,"40779":40357,"40780":8748,"40781":40381,"40782":27521,"40783":27569,"40784":40015,"40785":40592,"40786":40384,"40787":60817,"40788":60818,"40789":9775,"40790":9776,"40791":9783,"40792":9779,"40793":9780,"40794":9781,"40795":9778,"40796":9782,"40797":9777,"40798":40393,"40799":40404,"40800":40444,"40801":40458,"40802":40460,"40803":40462,"40804":40472,"40805":40571,"40806":40581,"40807":40610,"40808":40620,"40809":40625,"40810":40641,"40811":40646,"40812":40647,"40813":40689,"40814":40696,"40815":40743,"40816":39182,"40817":39193,"40818":39196,"40819":39223,"40820":39261,"40821":39266,"40822":39323,"40823":39332,"40824":39338,"40825":39352,"40826":39392,"40827":39398,"40828":39413,"40829":39455,"40830":32254,"40865":32263,"40866":32347,"40867":32357,"40868":32364,"40869":32567,"40870":32576,"40871":32577,"40872":32585,"40873":32594,"40874":32655,"40875":32659,"40876":32692,"40877":32733,"40878":32743,"40879":32762,"40880":32770,"40881":32776,"40882":32814,"40883":32815,"40884":32828,"40885":32935,"40886":33036,"40887":33066,"40888":33076,"40889":33090,"40890":33110,"40891":33156,"40892":33189,"40893":33252,"40894":33364,"40895":33381,"40896":33403,"40897":33415,"40898":33471,"40899":33506,"40900":33518,"40901":33528,"40902":33532,"40903":33535,"40904":33547,"40905":33565,"40906":33597,"40907":33623,"40908":33681,"40909":33708,"40910":33741,"40911":33773,"40912":33797,"40913":33812,"40914":33814,"40915":33825,"40916":33838,"40917":33854,"40918":33866,"40919":33875,"40920":33877,"40921":33880,"40922":33892,"40923":33906,"40924":33919,"40925":33920,"40926":33938,"40927":33939,"40928":33942,"40929":33955,"40930":33982,"40931":34014,"40932":34017,"40933":34018,"40934":34020,"40935":34040,"40936":34051,"40937":34053,"40938":34064,"40939":34099,"40940":8208,"40941":34114,"40942":34124,"40943":34130,"40944":34143,"40945":34159,"40946":34160,"40947":34163,"40948":34262,"40949":34272,"40950":34286,"40951":34300,"40952":34317,"40953":34319,"40954":34324,"40955":34344,"40956":34370,"40957":34373,"40958":34418,"41024":34972,"41025":23405,"41026":33079,"41027":60958,"41028":39224,"41029":21874,"41030":21867,"41031":60962,"41032":13774,"41033":21873,"41034":21946,"41035":22001,"41036":13778,"41037":22000,"41038":22021,"41039":22050,"41040":22061,"41041":22083,"41042":22046,"41043":22162,"41044":31949,"41045":21530,"41046":21523,"41047":21655,"41048":26353,"41049":30004,"41050":21581,"41051":22180,"41052":22175,"41053":25811,"41054":25390,"41055":25592,"41056":25886,"41057":20088,"41058":27626,"41059":27698,"41060":27709,"41061":27746,"41062":27826,"41063":28152,"41064":28201,"41065":28278,"41066":28290,"41067":28294,"41068":28347,"41069":28383,"41070":28386,"41071":28433,"41072":28452,"41073":28532,"41074":28561,"41075":28597,"41076":28659,"41077":28661,"41078":28859,"41079":28864,"41080":28943,"41081":8706,"41082":29013,"41083":29043,"41084":29050,"41085":61016,"41086":21027,"41121":61018,"41122":13393,"41123":61020,"41124":36812,"41125":61022,"41126":61023,"41127":192,"41128":200,"41129":204,"41130":210,"41131":217,"41132":193,"41133":205,"41134":211,"41135":218,"41136":257,"41137":275,"41138":299,"41139":333,"41140":363,"41141":470,"41142":196,"41143":203,"41144":207,"41145":214,"41146":220,"41147":198,"41148":199,"41149":209,"41150":195,"41151":213,"41152":225,"41153":233,"41154":237,"41155":243,"41156":250,"41157":472,"41158":228,"41159":235,"41160":239,"41161":246,"41162":252,"41163":230,"41164":231,"41165":241,"41166":227,"41167":245,"41168":462,"41169":283,"41170":464,"41171":466,"41172":468,"41173":474,"41174":197,"41175":201,"41176":29064,"41177":216,"41178":208,"41179":7922,"41180":222,"41181":223,"41182":170,"41183":161,"41184":224,"41185":232,"41186":236,"41187":242,"41188":249,"41189":476,"41190":229,"41191":29080,"41192":29143,"41193":248,"41194":240,"41195":7923,"41196":254,"41197":255,"41198":186,"41199":191,"41200":226,"41201":234,"41202":238,"41203":244,"41204":251,"41205":29173,"41206":194,"41207":202,"41208":206,"41209":212,"41210":219,"41211":184,"41212":164,"41213":61110,"41214":402,"41280":12288,"41281":65292,"41282":12289,"41283":12290,"41284":65294,"41285":8231,"41286":65307,"41287":65306,"41288":65311,"41289":65281,"41290":65072,"41291":8230,"41292":8229,"41293":65104,"41294":65105,"41295":65106,"41296":183,"41297":65108,"41298":65109,"41299":65110,"41300":65111,"41301":65372,"41302":8211,"41303":65073,"41304":8212,"41305":65075,"41306":9588,"41307":65076,"41308":65103,"41309":65288,"41310":65289,"41311":65077,"41312":65078,"41313":65371,"41314":65373,"41315":65079,"41316":65080,"41317":12308,"41318":12309,"41319":65081,"41320":65082,"41321":12304,"41322":12305,"41323":65083,"41324":65084,"41325":12298,"41326":12299,"41327":65085,"41328":65086,"41329":12296,"41330":12297,"41331":65087,"41332":65088,"41333":12300,"41334":12301,"41335":65089,"41336":65090,"41337":12302,"41338":12303,"41339":65091,"41340":65092,"41341":65113,"41342":65114,"41377":65115,"41378":65116,"41379":65117,"41380":65118,"41381":8216,"41382":8217,"41383":8220,"41384":8221,"41385":12317,"41386":12318,"41387":8245,"41388":8242,"41389":65283,"41390":65286,"41391":65290,"41392":8251,"41393":167,"41394":12291,"41395":9675,"41396":9679,"41397":9651,"41398":9650,"41399":9678,"41400":9734,"41401":9733,"41402":9671,"41403":9670,"41404":9633,"41405":9632,"41406":9661,"41407":9660,"41408":12963,"41409":8453,"41410":175,"41411":65507,"41412":65343,"41413":717,"41414":65097,"41415":65098,"41416":65101,"41417":65102,"41418":65099,"41419":65100,"41420":65119,"41421":65120,"41422":65121,"41423":65291,"41424":65293,"41425":215,"41426":247,"41427":177,"41428":8730,"41429":65308,"41430":65310,"41431":65309,"41432":8806,"41433":8807,"41434":8800,"41435":8734,"41436":8786,"41437":8801,"41438":65122,"41439":65123,"41440":65124,"41441":65125,"41442":65126,"41443":65374,"41444":8745,"41445":8746,"41446":8869,"41447":8736,"41448":8735,"41449":8895,"41450":13266,"41451":13265,"41452":8747,"41453":8750,"41454":8757,"41455":8756,"41456":9792,"41457":9794,"41458":8853,"41459":8857,"41460":8593,"41461":8595,"41462":8592,"41463":8594,"41464":8598,"41465":8599,"41466":8601,"41467":8600,"41468":8741,"41469":8739,"41470":65295,"41536":65340,"41537":8725,"41538":65128,"41539":65284,"41540":65509,"41541":12306,"41542":65504,"41543":65505,"41544":65285,"41545":65312,"41546":8451,"41547":8457,"41548":65129,"41549":65130,"41550":65131,"41551":13269,"41552":13212,"41553":13213,"41554":13214,"41555":13262,"41556":13217,"41557":13198,"41558":13199,"41559":13252,"41560":176,"41561":20825,"41562":20827,"41563":20830,"41564":20829,"41565":20833,"41566":20835,"41567":21991,"41568":29929,"41569":31950,"41570":9601,"41571":9602,"41572":9603,"41573":9604,"41574":9605,"41575":9606,"41576":9607,"41577":9608,"41578":9615,"41579":9614,"41580":9613,"41581":9612,"41582":9611,"41583":9610,"41584":9609,"41585":9532,"41586":9524,"41587":9516,"41588":9508,"41589":9500,"41590":9620,"41591":9472,"41592":9474,"41593":9621,"41594":9484,"41595":9488,"41596":9492,"41597":9496,"41598":9581,"41633":9582,"41634":9584,"41635":9583,"41636":9552,"41637":9566,"41638":9578,"41639":9569,"41640":9698,"41641":9699,"41642":9701,"41643":9700,"41644":9585,"41645":9586,"41646":9587,"41647":65296,"41648":65297,"41649":65298,"41650":65299,"41651":65300,"41652":65301,"41653":65302,"41654":65303,"41655":65304,"41656":65305,"41657":8544,"41658":8545,"41659":8546,"41660":8547,"41661":8548,"41662":8549,"41663":8550,"41664":8551,"41665":8552,"41666":8553,"41667":12321,"41668":12322,"41669":12323,"41670":12324,"41671":12325,"41672":12326,"41673":12327,"41674":12328,"41675":12329,"41676":21313,"41677":21316,"41678":21317,"41679":65313,"41680":65314,"41681":65315,"41682":65316,"41683":65317,"41684":65318,"41685":65319,"41686":65320,"41687":65321,"41688":65322,"41689":65323,"41690":65324,"41691":65325,"41692":65326,"41693":65327,"41694":65328,"41695":65329,"41696":65330,"41697":65331,"41698":65332,"41699":65333,"41700":65334,"41701":65335,"41702":65336,"41703":65337,"41704":65338,"41705":65345,"41706":65346,"41707":65347,"41708":65348,"41709":65349,"41710":65350,"41711":65351,"41712":65352,"41713":65353,"41714":65354,"41715":65355,"41716":65356,"41717":65357,"41718":65358,"41719":65359,"41720":65360,"41721":65361,"41722":65362,"41723":65363,"41724":65364,"41725":65365,"41726":65366,"41792":65367,"41793":65368,"41794":65369,"41795":65370,"41796":913,"41797":914,"41798":915,"41799":916,"41800":917,"41801":918,"41802":919,"41803":920,"41804":921,"41805":922,"41806":923,"41807":924,"41808":925,"41809":926,"41810":927,"41811":928,"41812":929,"41813":931,"41814":932,"41815":933,"41816":934,"41817":935,"41818":936,"41819":937,"41820":945,"41821":946,"41822":947,"41823":948,"41824":949,"41825":950,"41826":951,"41827":952,"41828":953,"41829":954,"41830":955,"41831":956,"41832":957,"41833":958,"41834":959,"41835":960,"41836":961,"41837":963,"41838":964,"41839":965,"41840":966,"41841":967,"41842":968,"41843":969,"41844":12549,"41845":12550,"41846":12551,"41847":12552,"41848":12553,"41849":12554,"41850":12555,"41851":12556,"41852":12557,"41853":12558,"41854":12559,"41889":12560,"41890":12561,"41891":12562,"41892":12563,"41893":12564,"41894":12565,"41895":12566,"41896":12567,"41897":12568,"41898":12569,"41899":12570,"41900":12571,"41901":12572,"41902":12573,"41903":12574,"41904":12575,"41905":12576,"41906":12577,"41907":12578,"41908":12579,"41909":12580,"41910":12581,"41911":12582,"41912":12583,"41913":12584,"41914":12585,"41915":729,"41916":713,"41917":714,"41918":711,"41919":715,"41920":9216,"41921":9217,"41922":9218,"41923":9219,"41924":9220,"41925":9221,"41926":9222,"41927":9223,"41928":9224,"41929":9225,"41930":9226,"41931":9227,"41932":9228,"41933":9229,"41934":9230,"41935":9231,"41936":9232,"41937":9233,"41938":9234,"41939":9235,"41940":9236,"41941":9237,"41942":9238,"41943":9239,"41944":9240,"41945":9241,"41946":9242,"41947":9243,"41948":9244,"41949":9245,"41950":9246,"41951":9247,"41952":9249,"41953":8364,"41954":63561,"41955":63562,"41956":63563,"41957":63564,"41958":63565,"41959":63566,"41960":63567,"41961":63568,"41962":63569,"41963":63570,"41964":63571,"41965":63572,"41966":63573,"41967":63574,"41968":63575,"41969":63576,"41970":63577,"41971":63578,"41972":63579,"41973":63580,"41974":63581,"41975":63582,"41976":63583,"41977":63584,"41978":63585,"41979":63586,"41980":63587,"41981":63588,"41982":63589,"42048":19968,"42049":20057,"42050":19969,"42051":19971,"42052":20035,"42053":20061,"42054":20102,"42055":20108,"42056":20154,"42057":20799,"42058":20837,"42059":20843,"42060":20960,"42061":20992,"42062":20993,"42063":21147,"42064":21269,"42065":21313,"42066":21340,"42067":21448,"42068":19977,"42069":19979,"42070":19976,"42071":19978,"42072":20011,"42073":20024,"42074":20961,"42075":20037,"42076":20040,"42077":20063,"42078":20062,"42079":20110,"42080":20129,"42081":20800,"42082":20995,"42083":21242,"42084":21315,"42085":21449,"42086":21475,"42087":22303,"42088":22763,"42089":22805,"42090":22823,"42091":22899,"42092":23376,"42093":23377,"42094":23379,"42095":23544,"42096":23567,"42097":23586,"42098":23608,"42099":23665,"42100":24029,"42101":24037,"42102":24049,"42103":24050,"42104":24051,"42105":24062,"42106":24178,"42107":24318,"42108":24331,"42109":24339,"42110":25165,"42145":19985,"42146":19984,"42147":19981,"42148":20013,"42149":20016,"42150":20025,"42151":20043,"42152":23609,"42153":20104,"42154":20113,"42155":20117,"42156":20114,"42157":20116,"42158":20130,"42159":20161,"42160":20160,"42161":20163,"42162":20166,"42163":20167,"42164":20173,"42165":20170,"42166":20171,"42167":20164,"42168":20803,"42169":20801,"42170":20839,"42171":20845,"42172":20846,"42173":20844,"42174":20887,"42175":20982,"42176":20998,"42177":20999,"42178":21000,"42179":21243,"42180":21246,"42181":21247,"42182":21270,"42183":21305,"42184":21320,"42185":21319,"42186":21317,"42187":21342,"42188":21380,"42189":21451,"42190":21450,"42191":21453,"42192":22764,"42193":22825,"42194":22827,"42195":22826,"42196":22829,"42197":23380,"42198":23569,"42199":23588,"42200":23610,"42201":23663,"42202":24052,"42203":24187,"42204":24319,"42205":24340,"42206":24341,"42207":24515,"42208":25096,"42209":25142,"42210":25163,"42211":25166,"42212":25903,"42213":25991,"42214":26007,"42215":26020,"42216":26041,"42217":26085,"42218":26352,"42219":26376,"42220":26408,"42221":27424,"42222":27490,"42223":27513,"42224":27595,"42225":27604,"42226":27611,"42227":27663,"42228":27700,"42229":28779,"42230":29226,"42231":29238,"42232":29243,"42233":29255,"42234":29273,"42235":29275,"42236":29356,"42237":29579,"42238":19993,"42304":19990,"42305":19989,"42306":19988,"42307":19992,"42308":20027,"42309":20045,"42310":20047,"42311":20046,"42312":20197,"42313":20184,"42314":20180,"42315":20181,"42316":20182,"42317":20183,"42318":20195,"42319":20196,"42320":20185,"42321":20190,"42322":20805,"42323":20804,"42324":20873,"42325":20874,"42326":20908,"42327":20985,"42328":20986,"42329":20984,"42330":21002,"42331":21152,"42332":21151,"42333":21253,"42334":21254,"42335":21271,"42336":21277,"42337":20191,"42338":21322,"42339":21321,"42340":21345,"42341":21344,"42342":21359,"42343":21358,"42344":21435,"42345":21487,"42346":21476,"42347":21491,"42348":21484,"42349":21486,"42350":21481,"42351":21480,"42352":21500,"42353":21496,"42354":21493,"42355":21483,"42356":21478,"42357":21482,"42358":21490,"42359":21489,"42360":21488,"42361":21477,"42362":21485,"42363":21499,"42364":22235,"42365":22234,"42366":22806,"42401":22830,"42402":22833,"42403":22900,"42404":22902,"42405":23381,"42406":23427,"42407":23612,"42408":24040,"42409":24039,"42410":24038,"42411":24066,"42412":24067,"42413":24179,"42414":24188,"42415":24321,"42416":24344,"42417":24343,"42418":24517,"42419":25098,"42420":25171,"42421":25172,"42422":25170,"42423":25169,"42424":26021,"42425":26086,"42426":26414,"42427":26412,"42428":26410,"42429":26411,"42430":26413,"42431":27491,"42432":27597,"42433":27665,"42434":27664,"42435":27704,"42436":27713,"42437":27712,"42438":27710,"42439":29359,"42440":29572,"42441":29577,"42442":29916,"42443":29926,"42444":29976,"42445":29983,"42446":29992,"42447":29993,"42448":30000,"42449":30001,"42450":30002,"42451":30003,"42452":30091,"42453":30333,"42454":30382,"42455":30399,"42456":30446,"42457":30683,"42458":30690,"42459":30707,"42460":31034,"42461":31166,"42462":31348,"42463":31435,"42464":19998,"42465":19999,"42466":20050,"42467":20051,"42468":20073,"42469":20121,"42470":20132,"42471":20134,"42472":20133,"42473":20223,"42474":20233,"42475":20249,"42476":20234,"42477":20245,"42478":20237,"42479":20240,"42480":20241,"42481":20239,"42482":20210,"42483":20214,"42484":20219,"42485":20208,"42486":20211,"42487":20221,"42488":20225,"42489":20235,"42490":20809,"42491":20807,"42492":20806,"42493":20808,"42494":20840,"42560":20849,"42561":20877,"42562":20912,"42563":21015,"42564":21009,"42565":21010,"42566":21006,"42567":21014,"42568":21155,"42569":21256,"42570":21281,"42571":21280,"42572":21360,"42573":21361,"42574":21513,"42575":21519,"42576":21516,"42577":21514,"42578":21520,"42579":21505,"42580":21515,"42581":21508,"42582":21521,"42583":21517,"42584":21512,"42585":21507,"42586":21518,"42587":21510,"42588":21522,"42589":22240,"42590":22238,"42591":22237,"42592":22323,"42593":22320,"42594":22312,"42595":22317,"42596":22316,"42597":22319,"42598":22313,"42599":22809,"42600":22810,"42601":22839,"42602":22840,"42603":22916,"42604":22904,"42605":22915,"42606":22909,"42607":22905,"42608":22914,"42609":22913,"42610":23383,"42611":23384,"42612":23431,"42613":23432,"42614":23429,"42615":23433,"42616":23546,"42617":23574,"42618":23673,"42619":24030,"42620":24070,"42621":24182,"42622":24180,"42657":24335,"42658":24347,"42659":24537,"42660":24534,"42661":25102,"42662":25100,"42663":25101,"42664":25104,"42665":25187,"42666":25179,"42667":25176,"42668":25910,"42669":26089,"42670":26088,"42671":26092,"42672":26093,"42673":26354,"42674":26355,"42675":26377,"42676":26429,"42677":26420,"42678":26417,"42679":26421,"42680":27425,"42681":27492,"42682":27515,"42683":27670,"42684":27741,"42685":27735,"42686":27737,"42687":27743,"42688":27744,"42689":27728,"42690":27733,"42691":27745,"42692":27739,"42693":27725,"42694":27726,"42695":28784,"42696":29279,"42697":29277,"42698":30334,"42699":31481,"42700":31859,"42701":31992,"42702":32566,"42703":32650,"42704":32701,"42705":32769,"42706":32771,"42707":32780,"42708":32786,"42709":32819,"42710":32895,"42711":32905,"42712":32907,"42713":32908,"42714":33251,"42715":33258,"42716":33267,"42717":33276,"42718":33292,"42719":33307,"42720":33311,"42721":33390,"42722":33394,"42723":33406,"42724":34411,"42725":34880,"42726":34892,"42727":34915,"42728":35199,"42729":38433,"42730":20018,"42731":20136,"42732":20301,"42733":20303,"42734":20295,"42735":20311,"42736":20318,"42737":20276,"42738":20315,"42739":20309,"42740":20272,"42741":20304,"42742":20305,"42743":20285,"42744":20282,"42745":20280,"42746":20291,"42747":20308,"42748":20284,"42749":20294,"42750":20323,"42816":20316,"42817":20320,"42818":20271,"42819":20302,"42820":20278,"42821":20313,"42822":20317,"42823":20296,"42824":20314,"42825":20812,"42826":20811,"42827":20813,"42828":20853,"42829":20918,"42830":20919,"42831":21029,"42832":21028,"42833":21033,"42834":21034,"42835":21032,"42836":21163,"42837":21161,"42838":21162,"42839":21164,"42840":21283,"42841":21363,"42842":21365,"42843":21533,"42844":21549,"42845":21534,"42846":21566,"42847":21542,"42848":21582,"42849":21543,"42850":21574,"42851":21571,"42852":21555,"42853":21576,"42854":21570,"42855":21531,"42856":21545,"42857":21578,"42858":21561,"42859":21563,"42860":21560,"42861":21550,"42862":21557,"42863":21558,"42864":21536,"42865":21564,"42866":21568,"42867":21553,"42868":21547,"42869":21535,"42870":21548,"42871":22250,"42872":22256,"42873":22244,"42874":22251,"42875":22346,"42876":22353,"42877":22336,"42878":22349,"42913":22343,"42914":22350,"42915":22334,"42916":22352,"42917":22351,"42918":22331,"42919":22767,"42920":22846,"42921":22941,"42922":22930,"42923":22952,"42924":22942,"42925":22947,"42926":22937,"42927":22934,"42928":22925,"42929":22948,"42930":22931,"42931":22922,"42932":22949,"42933":23389,"42934":23388,"42935":23386,"42936":23387,"42937":23436,"42938":23435,"42939":23439,"42940":23596,"42941":23616,"42942":23617,"42943":23615,"42944":23614,"42945":23696,"42946":23697,"42947":23700,"42948":23692,"42949":24043,"42950":24076,"42951":24207,"42952":24199,"42953":24202,"42954":24311,"42955":24324,"42956":24351,"42957":24420,"42958":24418,"42959":24439,"42960":24441,"42961":24536,"42962":24524,"42963":24535,"42964":24525,"42965":24561,"42966":24555,"42967":24568,"42968":24554,"42969":25106,"42970":25105,"42971":25220,"42972":25239,"42973":25238,"42974":25216,"42975":25206,"42976":25225,"42977":25197,"42978":25226,"42979":25212,"42980":25214,"42981":25209,"42982":25203,"42983":25234,"42984":25199,"42985":25240,"42986":25198,"42987":25237,"42988":25235,"42989":25233,"42990":25222,"42991":25913,"42992":25915,"42993":25912,"42994":26097,"42995":26356,"42996":26463,"42997":26446,"42998":26447,"42999":26448,"43000":26449,"43001":26460,"43002":26454,"43003":26462,"43004":26441,"43005":26438,"43006":26464,"43072":26451,"43073":26455,"43074":27493,"43075":27599,"43076":27714,"43077":27742,"43078":27801,"43079":27777,"43080":27784,"43081":27785,"43082":27781,"43083":27803,"43084":27754,"43085":27770,"43086":27792,"43087":27760,"43088":27788,"43089":27752,"43090":27798,"43091":27794,"43092":27773,"43093":27779,"43094":27762,"43095":27774,"43096":27764,"43097":27782,"43098":27766,"43099":27789,"43100":27796,"43101":27800,"43102":27778,"43103":28790,"43104":28796,"43105":28797,"43106":28792,"43107":29282,"43108":29281,"43109":29280,"43110":29380,"43111":29378,"43112":29590,"43113":29996,"43114":29995,"43115":30007,"43116":30008,"43117":30338,"43118":30447,"43119":30691,"43120":31169,"43121":31168,"43122":31167,"43123":31350,"43124":31995,"43125":32597,"43126":32918,"43127":32915,"43128":32925,"43129":32920,"43130":32923,"43131":32922,"43132":32946,"43133":33391,"43134":33426,"43169":33419,"43170":33421,"43171":35211,"43172":35282,"43173":35328,"43174":35895,"43175":35910,"43176":35925,"43177":35997,"43178":36196,"43179":36208,"43180":36275,"43181":36523,"43182":36554,"43183":36763,"43184":36784,"43185":36802,"43186":36806,"43187":36805,"43188":36804,"43189":24033,"43190":37009,"43191":37026,"43192":37034,"43193":37030,"43194":37027,"43195":37193,"43196":37318,"43197":37324,"43198":38450,"43199":38446,"43200":38449,"43201":38442,"43202":38444,"43203":20006,"43204":20054,"43205":20083,"43206":20107,"43207":20123,"43208":20126,"43209":20139,"43210":20140,"43211":20335,"43212":20381,"43213":20365,"43214":20339,"43215":20351,"43216":20332,"43217":20379,"43218":20363,"43219":20358,"43220":20355,"43221":20336,"43222":20341,"43223":20360,"43224":20329,"43225":20347,"43226":20374,"43227":20350,"43228":20367,"43229":20369,"43230":20346,"43231":20820,"43232":20818,"43233":20821,"43234":20841,"43235":20855,"43236":20854,"43237":20856,"43238":20925,"43239":20989,"43240":21051,"43241":21048,"43242":21047,"43243":21050,"43244":21040,"43245":21038,"43246":21046,"43247":21057,"43248":21182,"43249":21179,"43250":21330,"43251":21332,"43252":21331,"43253":21329,"43254":21350,"43255":21367,"43256":21368,"43257":21369,"43258":21462,"43259":21460,"43260":21463,"43261":21619,"43262":21621,"43328":21654,"43329":21624,"43330":21653,"43331":21632,"43332":21627,"43333":21623,"43334":21636,"43335":21650,"43336":21638,"43337":21628,"43338":21648,"43339":21617,"43340":21622,"43341":21644,"43342":21658,"43343":21602,"43344":21608,"43345":21643,"43346":21629,"43347":21646,"43348":22266,"43349":22403,"43350":22391,"43351":22378,"43352":22377,"43353":22369,"43354":22374,"43355":22372,"43356":22396,"43357":22812,"43358":22857,"43359":22855,"43360":22856,"43361":22852,"43362":22868,"43363":22974,"43364":22971,"43365":22996,"43366":22969,"43367":22958,"43368":22993,"43369":22982,"43370":22992,"43371":22989,"43372":22987,"43373":22995,"43374":22986,"43375":22959,"43376":22963,"43377":22994,"43378":22981,"43379":23391,"43380":23396,"43381":23395,"43382":23447,"43383":23450,"43384":23448,"43385":23452,"43386":23449,"43387":23451,"43388":23578,"43389":23624,"43390":23621,"43425":23622,"43426":23735,"43427":23713,"43428":23736,"43429":23721,"43430":23723,"43431":23729,"43432":23731,"43433":24088,"43434":24090,"43435":24086,"43436":24085,"43437":24091,"43438":24081,"43439":24184,"43440":24218,"43441":24215,"43442":24220,"43443":24213,"43444":24214,"43445":24310,"43446":24358,"43447":24359,"43448":24361,"43449":24448,"43450":24449,"43451":24447,"43452":24444,"43453":24541,"43454":24544,"43455":24573,"43456":24565,"43457":24575,"43458":24591,"43459":24596,"43460":24623,"43461":24629,"43462":24598,"43463":24618,"43464":24597,"43465":24609,"43466":24615,"43467":24617,"43468":24619,"43469":24603,"43470":25110,"43471":25109,"43472":25151,"43473":25150,"43474":25152,"43475":25215,"43476":25289,"43477":25292,"43478":25284,"43479":25279,"43480":25282,"43481":25273,"43482":25298,"43483":25307,"43484":25259,"43485":25299,"43486":25300,"43487":25291,"43488":25288,"43489":25256,"43490":25277,"43491":25276,"43492":25296,"43493":25305,"43494":25287,"43495":25293,"43496":25269,"43497":25306,"43498":25265,"43499":25304,"43500":25302,"43501":25303,"43502":25286,"43503":25260,"43504":25294,"43505":25918,"43506":26023,"43507":26044,"43508":26106,"43509":26132,"43510":26131,"43511":26124,"43512":26118,"43513":26114,"43514":26126,"43515":26112,"43516":26127,"43517":26133,"43518":26122,"43584":26119,"43585":26381,"43586":26379,"43587":26477,"43588":26507,"43589":26517,"43590":26481,"43591":26524,"43592":26483,"43593":26487,"43594":26503,"43595":26525,"43596":26519,"43597":26479,"43598":26480,"43599":26495,"43600":26505,"43601":26494,"43602":26512,"43603":26485,"43604":26522,"43605":26515,"43606":26492,"43607":26474,"43608":26482,"43609":27427,"43610":27494,"43611":27495,"43612":27519,"43613":27667,"43614":27675,"43615":27875,"43616":27880,"43617":27891,"43618":27825,"43619":27852,"43620":27877,"43621":27827,"43622":27837,"43623":27838,"43624":27836,"43625":27874,"43626":27819,"43627":27861,"43628":27859,"43629":27832,"43630":27844,"43631":27833,"43632":27841,"43633":27822,"43634":27863,"43635":27845,"43636":27889,"43637":27839,"43638":27835,"43639":27873,"43640":27867,"43641":27850,"43642":27820,"43643":27887,"43644":27868,"43645":27862,"43646":27872,"43681":28821,"43682":28814,"43683":28818,"43684":28810,"43685":28825,"43686":29228,"43687":29229,"43688":29240,"43689":29256,"43690":29287,"43691":29289,"43692":29376,"43693":29390,"43694":29401,"43695":29399,"43696":29392,"43697":29609,"43698":29608,"43699":29599,"43700":29611,"43701":29605,"43702":30013,"43703":30109,"43704":30105,"43705":30106,"43706":30340,"43707":30402,"43708":30450,"43709":30452,"43710":30693,"43711":30717,"43712":31038,"43713":31040,"43714":31041,"43715":31177,"43716":31176,"43717":31354,"43718":31353,"43719":31482,"43720":31998,"43721":32596,"43722":32652,"43723":32651,"43724":32773,"43725":32954,"43726":32933,"43727":32930,"43728":32945,"43729":32929,"43730":32939,"43731":32937,"43732":32948,"43733":32938,"43734":32943,"43735":33253,"43736":33278,"43737":33293,"43738":33459,"43739":33437,"43740":33433,"43741":33453,"43742":33469,"43743":33439,"43744":33465,"43745":33457,"43746":33452,"43747":33445,"43748":33455,"43749":33464,"43750":33443,"43751":33456,"43752":33470,"43753":33463,"43754":34382,"43755":34417,"43756":21021,"43757":34920,"43758":36555,"43759":36814,"43760":36820,"43761":36817,"43762":37045,"43763":37048,"43764":37041,"43765":37046,"43766":37319,"43767":37329,"43768":38263,"43769":38272,"43770":38428,"43771":38464,"43772":38463,"43773":38459,"43774":38468,"43840":38466,"43841":38585,"43842":38632,"43843":38738,"43844":38750,"43845":20127,"43846":20141,"43847":20142,"43848":20449,"43849":20405,"43850":20399,"43851":20415,"43852":20448,"43853":20433,"43854":20431,"43855":20445,"43856":20419,"43857":20406,"43858":20440,"43859":20447,"43860":20426,"43861":20439,"43862":20398,"43863":20432,"43864":20420,"43865":20418,"43866":20442,"43867":20430,"43868":20446,"43869":20407,"43870":20823,"43871":20882,"43872":20881,"43873":20896,"43874":21070,"43875":21059,"43876":21066,"43877":21069,"43878":21068,"43879":21067,"43880":21063,"43881":21191,"43882":21193,"43883":21187,"43884":21185,"43885":21261,"43886":21335,"43887":21371,"43888":21402,"43889":21467,"43890":21676,"43891":21696,"43892":21672,"43893":21710,"43894":21705,"43895":21688,"43896":21670,"43897":21683,"43898":21703,"43899":21698,"43900":21693,"43901":21674,"43902":21697,"43937":21700,"43938":21704,"43939":21679,"43940":21675,"43941":21681,"43942":21691,"43943":21673,"43944":21671,"43945":21695,"43946":22271,"43947":22402,"43948":22411,"43949":22432,"43950":22435,"43951":22434,"43952":22478,"43953":22446,"43954":22419,"43955":22869,"43956":22865,"43957":22863,"43958":22862,"43959":22864,"43960":23004,"43961":23000,"43962":23039,"43963":23011,"43964":23016,"43965":23043,"43966":23013,"43967":23018,"43968":23002,"43969":23014,"43970":23041,"43971":23035,"43972":23401,"43973":23459,"43974":23462,"43975":23460,"43976":23458,"43977":23461,"43978":23553,"43979":23630,"43980":23631,"43981":23629,"43982":23627,"43983":23769,"43984":23762,"43985":24055,"43986":24093,"43987":24101,"43988":24095,"43989":24189,"43990":24224,"43991":24230,"43992":24314,"43993":24328,"43994":24365,"43995":24421,"43996":24456,"43997":24453,"43998":24458,"43999":24459,"44000":24455,"44001":24460,"44002":24457,"44003":24594,"44004":24605,"44005":24608,"44006":24613,"44007":24590,"44008":24616,"44009":24653,"44010":24688,"44011":24680,"44012":24674,"44013":24646,"44014":24643,"44015":24684,"44016":24683,"44017":24682,"44018":24676,"44019":25153,"44020":25308,"44021":25366,"44022":25353,"44023":25340,"44024":25325,"44025":25345,"44026":25326,"44027":25341,"44028":25351,"44029":25329,"44030":25335,"44096":25327,"44097":25324,"44098":25342,"44099":25332,"44100":25361,"44101":25346,"44102":25919,"44103":25925,"44104":26027,"44105":26045,"44106":26082,"44107":26149,"44108":26157,"44109":26144,"44110":26151,"44111":26159,"44112":26143,"44113":26152,"44114":26161,"44115":26148,"44116":26359,"44117":26623,"44118":26579,"44119":26609,"44120":26580,"44121":26576,"44122":26604,"44123":26550,"44124":26543,"44125":26613,"44126":26601,"44127":26607,"44128":26564,"44129":26577,"44130":26548,"44131":26586,"44132":26597,"44133":26552,"44134":26575,"44135":26590,"44136":26611,"44137":26544,"44138":26585,"44139":26594,"44140":26589,"44141":26578,"44142":27498,"44143":27523,"44144":27526,"44145":27573,"44146":27602,"44147":27607,"44148":27679,"44149":27849,"44150":27915,"44151":27954,"44152":27946,"44153":27969,"44154":27941,"44155":27916,"44156":27953,"44157":27934,"44158":27927,"44193":27963,"44194":27965,"44195":27966,"44196":27958,"44197":27931,"44198":27893,"44199":27961,"44200":27943,"44201":27960,"44202":27945,"44203":27950,"44204":27957,"44205":27918,"44206":27947,"44207":28843,"44208":28858,"44209":28851,"44210":28844,"44211":28847,"44212":28845,"44213":28856,"44214":28846,"44215":28836,"44216":29232,"44217":29298,"44218":29295,"44219":29300,"44220":29417,"44221":29408,"44222":29409,"44223":29623,"44224":29642,"44225":29627,"44226":29618,"44227":29645,"44228":29632,"44229":29619,"44230":29978,"44231":29997,"44232":30031,"44233":30028,"44234":30030,"44235":30027,"44236":30123,"44237":30116,"44238":30117,"44239":30114,"44240":30115,"44241":30328,"44242":30342,"44243":30343,"44244":30344,"44245":30408,"44246":30406,"44247":30403,"44248":30405,"44249":30465,"44250":30457,"44251":30456,"44252":30473,"44253":30475,"44254":30462,"44255":30460,"44256":30471,"44257":30684,"44258":30722,"44259":30740,"44260":30732,"44261":30733,"44262":31046,"44263":31049,"44264":31048,"44265":31047,"44266":31161,"44267":31162,"44268":31185,"44269":31186,"44270":31179,"44271":31359,"44272":31361,"44273":31487,"44274":31485,"44275":31869,"44276":32002,"44277":32005,"44278":32000,"44279":32009,"44280":32007,"44281":32004,"44282":32006,"44283":32568,"44284":32654,"44285":32703,"44286":32772,"44352":32784,"44353":32781,"44354":32785,"44355":32822,"44356":32982,"44357":32997,"44358":32986,"44359":32963,"44360":32964,"44361":32972,"44362":32993,"44363":32987,"44364":32974,"44365":32990,"44366":32996,"44367":32989,"44368":33268,"44369":33314,"44370":33511,"44371":33539,"44372":33541,"44373":33507,"44374":33499,"44375":33510,"44376":33540,"44377":33509,"44378":33538,"44379":33545,"44380":33490,"44381":33495,"44382":33521,"44383":33537,"44384":33500,"44385":33492,"44386":33489,"44387":33502,"44388":33491,"44389":33503,"44390":33519,"44391":33542,"44392":34384,"44393":34425,"44394":34427,"44395":34426,"44396":34893,"44397":34923,"44398":35201,"44399":35284,"44400":35336,"44401":35330,"44402":35331,"44403":35998,"44404":36000,"44405":36212,"44406":36211,"44407":36276,"44408":36557,"44409":36556,"44410":36848,"44411":36838,"44412":36834,"44413":36842,"44414":36837,"44449":36845,"44450":36843,"44451":36836,"44452":36840,"44453":37066,"44454":37070,"44455":37057,"44456":37059,"44457":37195,"44458":37194,"44459":37325,"44460":38274,"44461":38480,"44462":38475,"44463":38476,"44464":38477,"44465":38754,"44466":38761,"44467":38859,"44468":38893,"44469":38899,"44470":38913,"44471":39080,"44472":39131,"44473":39135,"44474":39318,"44475":39321,"44476":20056,"44477":20147,"44478":20492,"44479":20493,"44480":20515,"44481":20463,"44482":20518,"44483":20517,"44484":20472,"44485":20521,"44486":20502,"44487":20486,"44488":20540,"44489":20511,"44490":20506,"44491":20498,"44492":20497,"44493":20474,"44494":20480,"44495":20500,"44496":20520,"44497":20465,"44498":20513,"44499":20491,"44500":20505,"44501":20504,"44502":20467,"44503":20462,"44504":20525,"44505":20522,"44506":20478,"44507":20523,"44508":20489,"44509":20860,"44510":20900,"44511":20901,"44512":20898,"44513":20941,"44514":20940,"44515":20934,"44516":20939,"44517":21078,"44518":21084,"44519":21076,"44520":21083,"44521":21085,"44522":21290,"44523":21375,"44524":21407,"44525":21405,"44526":21471,"44527":21736,"44528":21776,"44529":21761,"44530":21815,"44531":21756,"44532":21733,"44533":21746,"44534":21766,"44535":21754,"44536":21780,"44537":21737,"44538":21741,"44539":21729,"44540":21769,"44541":21742,"44542":21738,"44608":21734,"44609":21799,"44610":21767,"44611":21757,"44612":21775,"44613":22275,"44614":22276,"44615":22466,"44616":22484,"44617":22475,"44618":22467,"44619":22537,"44620":22799,"44621":22871,"44622":22872,"44623":22874,"44624":23057,"44625":23064,"44626":23068,"44627":23071,"44628":23067,"44629":23059,"44630":23020,"44631":23072,"44632":23075,"44633":23081,"44634":23077,"44635":23052,"44636":23049,"44637":23403,"44638":23640,"44639":23472,"44640":23475,"44641":23478,"44642":23476,"44643":23470,"44644":23477,"44645":23481,"44646":23480,"44647":23556,"44648":23633,"44649":23637,"44650":23632,"44651":23789,"44652":23805,"44653":23803,"44654":23786,"44655":23784,"44656":23792,"44657":23798,"44658":23809,"44659":23796,"44660":24046,"44661":24109,"44662":24107,"44663":24235,"44664":24237,"44665":24231,"44666":24369,"44667":24466,"44668":24465,"44669":24464,"44670":24665,"44705":24675,"44706":24677,"44707":24656,"44708":24661,"44709":24685,"44710":24681,"44711":24687,"44712":24708,"44713":24735,"44714":24730,"44715":24717,"44716":24724,"44717":24716,"44718":24709,"44719":24726,"44720":25159,"44721":25331,"44722":25352,"44723":25343,"44724":25422,"44725":25406,"44726":25391,"44727":25429,"44728":25410,"44729":25414,"44730":25423,"44731":25417,"44732":25402,"44733":25424,"44734":25405,"44735":25386,"44736":25387,"44737":25384,"44738":25421,"44739":25420,"44740":25928,"44741":25929,"44742":26009,"44743":26049,"44744":26053,"44745":26178,"44746":26185,"44747":26191,"44748":26179,"44749":26194,"44750":26188,"44751":26181,"44752":26177,"44753":26360,"44754":26388,"44755":26389,"44756":26391,"44757":26657,"44758":26680,"44759":26696,"44760":26694,"44761":26707,"44762":26681,"44763":26690,"44764":26708,"44765":26665,"44766":26803,"44767":26647,"44768":26700,"44769":26705,"44770":26685,"44771":26612,"44772":26704,"44773":26688,"44774":26684,"44775":26691,"44776":26666,"44777":26693,"44778":26643,"44779":26648,"44780":26689,"44781":27530,"44782":27529,"44783":27575,"44784":27683,"44785":27687,"44786":27688,"44787":27686,"44788":27684,"44789":27888,"44790":28010,"44791":28053,"44792":28040,"44793":28039,"44794":28006,"44795":28024,"44796":28023,"44797":27993,"44798":28051,"44864":28012,"44865":28041,"44866":28014,"44867":27994,"44868":28020,"44869":28009,"44870":28044,"44871":28042,"44872":28025,"44873":28037,"44874":28005,"44875":28052,"44876":28874,"44877":28888,"44878":28900,"44879":28889,"44880":28872,"44881":28879,"44882":29241,"44883":29305,"44884":29436,"44885":29433,"44886":29437,"44887":29432,"44888":29431,"44889":29574,"44890":29677,"44891":29705,"44892":29678,"44893":29664,"44894":29674,"44895":29662,"44896":30036,"44897":30045,"44898":30044,"44899":30042,"44900":30041,"44901":30142,"44902":30149,"44903":30151,"44904":30130,"44905":30131,"44906":30141,"44907":30140,"44908":30137,"44909":30146,"44910":30136,"44911":30347,"44912":30384,"44913":30410,"44914":30413,"44915":30414,"44916":30505,"44917":30495,"44918":30496,"44919":30504,"44920":30697,"44921":30768,"44922":30759,"44923":30776,"44924":30749,"44925":30772,"44926":30775,"44961":30757,"44962":30765,"44963":30752,"44964":30751,"44965":30770,"44966":31061,"44967":31056,"44968":31072,"44969":31071,"44970":31062,"44971":31070,"44972":31069,"44973":31063,"44974":31066,"44975":31204,"44976":31203,"44977":31207,"44978":31199,"44979":31206,"44980":31209,"44981":31192,"44982":31364,"44983":31368,"44984":31449,"44985":31494,"44986":31505,"44987":31881,"44988":32033,"44989":32023,"44990":32011,"44991":32010,"44992":32032,"44993":32034,"44994":32020,"44995":32016,"44996":32021,"44997":32026,"44998":32028,"44999":32013,"45000":32025,"45001":32027,"45002":32570,"45003":32607,"45004":32660,"45005":32709,"45006":32705,"45007":32774,"45008":32792,"45009":32789,"45010":32793,"45011":32791,"45012":32829,"45013":32831,"45014":33009,"45015":33026,"45016":33008,"45017":33029,"45018":33005,"45019":33012,"45020":33030,"45021":33016,"45022":33011,"45023":33032,"45024":33021,"45025":33034,"45026":33020,"45027":33007,"45028":33261,"45029":33260,"45030":33280,"45031":33296,"45032":33322,"45033":33323,"45034":33320,"45035":33324,"45036":33467,"45037":33579,"45038":33618,"45039":33620,"45040":33610,"45041":33592,"45042":33616,"45043":33609,"45044":33589,"45045":33588,"45046":33615,"45047":33586,"45048":33593,"45049":33590,"45050":33559,"45051":33600,"45052":33585,"45053":33576,"45054":33603,"45120":34388,"45121":34442,"45122":34474,"45123":34451,"45124":34468,"45125":34473,"45126":34444,"45127":34467,"45128":34460,"45129":34928,"45130":34935,"45131":34945,"45132":34946,"45133":34941,"45134":34937,"45135":35352,"45136":35344,"45137":35342,"45138":35340,"45139":35349,"45140":35338,"45141":35351,"45142":35347,"45143":35350,"45144":35343,"45145":35345,"45146":35912,"45147":35962,"45148":35961,"45149":36001,"45150":36002,"45151":36215,"45152":36524,"45153":36562,"45154":36564,"45155":36559,"45156":36785,"45157":36865,"45158":36870,"45159":36855,"45160":36864,"45161":36858,"45162":36852,"45163":36867,"45164":36861,"45165":36869,"45166":36856,"45167":37013,"45168":37089,"45169":37085,"45170":37090,"45171":37202,"45172":37197,"45173":37196,"45174":37336,"45175":37341,"45176":37335,"45177":37340,"45178":37337,"45179":38275,"45180":38498,"45181":38499,"45182":38497,"45217":38491,"45218":38493,"45219":38500,"45220":38488,"45221":38494,"45222":38587,"45223":39138,"45224":39340,"45225":39592,"45226":39640,"45227":39717,"45228":39730,"45229":39740,"45230":20094,"45231":20602,"45232":20605,"45233":20572,"45234":20551,"45235":20547,"45236":20556,"45237":20570,"45238":20553,"45239":20581,"45240":20598,"45241":20558,"45242":20565,"45243":20597,"45244":20596,"45245":20599,"45246":20559,"45247":20495,"45248":20591,"45249":20589,"45250":20828,"45251":20885,"45252":20976,"45253":21098,"45254":21103,"45255":21202,"45256":21209,"45257":21208,"45258":21205,"45259":21264,"45260":21263,"45261":21273,"45262":21311,"45263":21312,"45264":21310,"45265":21443,"45266":26364,"45267":21830,"45268":21866,"45269":21862,"45270":21828,"45271":21854,"45272":21857,"45273":21827,"45274":21834,"45275":21809,"45276":21846,"45277":21839,"45278":21845,"45279":21807,"45280":21860,"45281":21816,"45282":21806,"45283":21852,"45284":21804,"45285":21859,"45286":21811,"45287":21825,"45288":21847,"45289":22280,"45290":22283,"45291":22281,"45292":22495,"45293":22533,"45294":22538,"45295":22534,"45296":22496,"45297":22500,"45298":22522,"45299":22530,"45300":22581,"45301":22519,"45302":22521,"45303":22816,"45304":22882,"45305":23094,"45306":23105,"45307":23113,"45308":23142,"45309":23146,"45310":23104,"45376":23100,"45377":23138,"45378":23130,"45379":23110,"45380":23114,"45381":23408,"45382":23495,"45383":23493,"45384":23492,"45385":23490,"45386":23487,"45387":23494,"45388":23561,"45389":23560,"45390":23559,"45391":23648,"45392":23644,"45393":23645,"45394":23815,"45395":23814,"45396":23822,"45397":23835,"45398":23830,"45399":23842,"45400":23825,"45401":23849,"45402":23828,"45403":23833,"45404":23844,"45405":23847,"45406":23831,"45407":24034,"45408":24120,"45409":24118,"45410":24115,"45411":24119,"45412":24247,"45413":24248,"45414":24246,"45415":24245,"45416":24254,"45417":24373,"45418":24375,"45419":24407,"45420":24428,"45421":24425,"45422":24427,"45423":24471,"45424":24473,"45425":24478,"45426":24472,"45427":24481,"45428":24480,"45429":24476,"45430":24703,"45431":24739,"45432":24713,"45433":24736,"45434":24744,"45435":24779,"45436":24756,"45437":24806,"45438":24765,"45473":24773,"45474":24763,"45475":24757,"45476":24796,"45477":24764,"45478":24792,"45479":24789,"45480":24774,"45481":24799,"45482":24760,"45483":24794,"45484":24775,"45485":25114,"45486":25115,"45487":25160,"45488":25504,"45489":25511,"45490":25458,"45491":25494,"45492":25506,"45493":25509,"45494":25463,"45495":25447,"45496":25496,"45497":25514,"45498":25457,"45499":25513,"45500":25481,"45501":25475,"45502":25499,"45503":25451,"45504":25512,"45505":25476,"45506":25480,"45507":25497,"45508":25505,"45509":25516,"45510":25490,"45511":25487,"45512":25472,"45513":25467,"45514":25449,"45515":25448,"45516":25466,"45517":25949,"45518":25942,"45519":25937,"45520":25945,"45521":25943,"45522":21855,"45523":25935,"45524":25944,"45525":25941,"45526":25940,"45527":26012,"45528":26011,"45529":26028,"45530":26063,"45531":26059,"45532":26060,"45533":26062,"45534":26205,"45535":26202,"45536":26212,"45537":26216,"45538":26214,"45539":26206,"45540":26361,"45541":21207,"45542":26395,"45543":26753,"45544":26799,"45545":26786,"45546":26771,"45547":26805,"45548":26751,"45549":26742,"45550":26801,"45551":26791,"45552":26775,"45553":26800,"45554":26755,"45555":26820,"45556":26797,"45557":26758,"45558":26757,"45559":26772,"45560":26781,"45561":26792,"45562":26783,"45563":26785,"45564":26754,"45565":27442,"45566":27578,"45632":27627,"45633":27628,"45634":27691,"45635":28046,"45636":28092,"45637":28147,"45638":28121,"45639":28082,"45640":28129,"45641":28108,"45642":28132,"45643":28155,"45644":28154,"45645":28165,"45646":28103,"45647":28107,"45648":28079,"45649":28113,"45650":28078,"45651":28126,"45652":28153,"45653":28088,"45654":28151,"45655":28149,"45656":28101,"45657":28114,"45658":28186,"45659":28085,"45660":28122,"45661":28139,"45662":28120,"45663":28138,"45664":28145,"45665":28142,"45666":28136,"45667":28102,"45668":28100,"45669":28074,"45670":28140,"45671":28095,"45672":28134,"45673":28921,"45674":28937,"45675":28938,"45676":28925,"45677":28911,"45678":29245,"45679":29309,"45680":29313,"45681":29468,"45682":29467,"45683":29462,"45684":29459,"45685":29465,"45686":29575,"45687":29701,"45688":29706,"45689":29699,"45690":29702,"45691":29694,"45692":29709,"45693":29920,"45694":29942,"45729":29943,"45730":29980,"45731":29986,"45732":30053,"45733":30054,"45734":30050,"45735":30064,"45736":30095,"45737":30164,"45738":30165,"45739":30133,"45740":30154,"45741":30157,"45742":30350,"45743":30420,"45744":30418,"45745":30427,"45746":30519,"45747":30526,"45748":30524,"45749":30518,"45750":30520,"45751":30522,"45752":30827,"45753":30787,"45754":30798,"45755":31077,"45756":31080,"45757":31085,"45758":31227,"45759":31378,"45760":31381,"45761":31520,"45762":31528,"45763":31515,"45764":31532,"45765":31526,"45766":31513,"45767":31518,"45768":31534,"45769":31890,"45770":31895,"45771":31893,"45772":32070,"45773":32067,"45774":32113,"45775":32046,"45776":32057,"45777":32060,"45778":32064,"45779":32048,"45780":32051,"45781":32068,"45782":32047,"45783":32066,"45784":32050,"45785":32049,"45786":32573,"45787":32670,"45788":32666,"45789":32716,"45790":32718,"45791":32722,"45792":32796,"45793":32842,"45794":32838,"45795":33071,"45796":33046,"45797":33059,"45798":33067,"45799":33065,"45800":33072,"45801":33060,"45802":33282,"45803":33333,"45804":33335,"45805":33334,"45806":33337,"45807":33678,"45808":33694,"45809":33688,"45810":33656,"45811":33698,"45812":33686,"45813":33725,"45814":33707,"45815":33682,"45816":33674,"45817":33683,"45818":33673,"45819":33696,"45820":33655,"45821":33659,"45822":33660,"45888":33670,"45889":33703,"45890":34389,"45891":24426,"45892":34503,"45893":34496,"45894":34486,"45895":34500,"45896":34485,"45897":34502,"45898":34507,"45899":34481,"45900":34479,"45901":34505,"45902":34899,"45903":34974,"45904":34952,"45905":34987,"45906":34962,"45907":34966,"45908":34957,"45909":34955,"45910":35219,"45911":35215,"45912":35370,"45913":35357,"45914":35363,"45915":35365,"45916":35377,"45917":35373,"45918":35359,"45919":35355,"45920":35362,"45921":35913,"45922":35930,"45923":36009,"45924":36012,"45925":36011,"45926":36008,"45927":36010,"45928":36007,"45929":36199,"45930":36198,"45931":36286,"45932":36282,"45933":36571,"45934":36575,"45935":36889,"45936":36877,"45937":36890,"45938":36887,"45939":36899,"45940":36895,"45941":36893,"45942":36880,"45943":36885,"45944":36894,"45945":36896,"45946":36879,"45947":36898,"45948":36886,"45949":36891,"45950":36884,"45985":37096,"45986":37101,"45987":37117,"45988":37207,"45989":37326,"45990":37365,"45991":37350,"45992":37347,"45993":37351,"45994":37357,"45995":37353,"45996":38281,"45997":38506,"45998":38517,"45999":38515,"46000":38520,"46001":38512,"46002":38516,"46003":38518,"46004":38519,"46005":38508,"46006":38592,"46007":38634,"46008":38633,"46009":31456,"46010":31455,"46011":38914,"46012":38915,"46013":39770,"46014":40165,"46015":40565,"46016":40575,"46017":40613,"46018":40635,"46019":20642,"46020":20621,"46021":20613,"46022":20633,"46023":20625,"46024":20608,"46025":20630,"46026":20632,"46027":20634,"46028":26368,"46029":20977,"46030":21106,"46031":21108,"46032":21109,"46033":21097,"46034":21214,"46035":21213,"46036":21211,"46037":21338,"46038":21413,"46039":21883,"46040":21888,"46041":21927,"46042":21884,"46043":21898,"46044":21917,"46045":21912,"46046":21890,"46047":21916,"46048":21930,"46049":21908,"46050":21895,"46051":21899,"46052":21891,"46053":21939,"46054":21934,"46055":21919,"46056":21822,"46057":21938,"46058":21914,"46059":21947,"46060":21932,"46061":21937,"46062":21886,"46063":21897,"46064":21931,"46065":21913,"46066":22285,"46067":22575,"46068":22570,"46069":22580,"46070":22564,"46071":22576,"46072":22577,"46073":22561,"46074":22557,"46075":22560,"46076":22777,"46077":22778,"46078":22880,"46144":23159,"46145":23194,"46146":23167,"46147":23186,"46148":23195,"46149":23207,"46150":23411,"46151":23409,"46152":23506,"46153":23500,"46154":23507,"46155":23504,"46156":23562,"46157":23563,"46158":23601,"46159":23884,"46160":23888,"46161":23860,"46162":23879,"46163":24061,"46164":24133,"46165":24125,"46166":24128,"46167":24131,"46168":24190,"46169":24266,"46170":24257,"46171":24258,"46172":24260,"46173":24380,"46174":24429,"46175":24489,"46176":24490,"46177":24488,"46178":24785,"46179":24801,"46180":24754,"46181":24758,"46182":24800,"46183":24860,"46184":24867,"46185":24826,"46186":24853,"46187":24816,"46188":24827,"46189":24820,"46190":24936,"46191":24817,"46192":24846,"46193":24822,"46194":24841,"46195":24832,"46196":24850,"46197":25119,"46198":25161,"46199":25507,"46200":25484,"46201":25551,"46202":25536,"46203":25577,"46204":25545,"46205":25542,"46206":25549,"46241":25554,"46242":25571,"46243":25552,"46244":25569,"46245":25558,"46246":25581,"46247":25582,"46248":25462,"46249":25588,"46250":25578,"46251":25563,"46252":25682,"46253":25562,"46254":25593,"46255":25950,"46256":25958,"46257":25954,"46258":25955,"46259":26001,"46260":26000,"46261":26031,"46262":26222,"46263":26224,"46264":26228,"46265":26230,"46266":26223,"46267":26257,"46268":26234,"46269":26238,"46270":26231,"46271":26366,"46272":26367,"46273":26399,"46274":26397,"46275":26874,"46276":26837,"46277":26848,"46278":26840,"46279":26839,"46280":26885,"46281":26847,"46282":26869,"46283":26862,"46284":26855,"46285":26873,"46286":26834,"46287":26866,"46288":26851,"46289":26827,"46290":26829,"46291":26893,"46292":26898,"46293":26894,"46294":26825,"46295":26842,"46296":26990,"46297":26875,"46298":27454,"46299":27450,"46300":27453,"46301":27544,"46302":27542,"46303":27580,"46304":27631,"46305":27694,"46306":27695,"46307":27692,"46308":28207,"46309":28216,"46310":28244,"46311":28193,"46312":28210,"46313":28263,"46314":28234,"46315":28192,"46316":28197,"46317":28195,"46318":28187,"46319":28251,"46320":28248,"46321":28196,"46322":28246,"46323":28270,"46324":28205,"46325":28198,"46326":28271,"46327":28212,"46328":28237,"46329":28218,"46330":28204,"46331":28227,"46332":28189,"46333":28222,"46334":28363,"46400":28297,"46401":28185,"46402":28238,"46403":28259,"46404":28228,"46405":28274,"46406":28265,"46407":28255,"46408":28953,"46409":28954,"46410":28966,"46411":28976,"46412":28961,"46413":28982,"46414":29038,"46415":28956,"46416":29260,"46417":29316,"46418":29312,"46419":29494,"46420":29477,"46421":29492,"46422":29481,"46423":29754,"46424":29738,"46425":29747,"46426":29730,"46427":29733,"46428":29749,"46429":29750,"46430":29748,"46431":29743,"46432":29723,"46433":29734,"46434":29736,"46435":29989,"46436":29990,"46437":30059,"46438":30058,"46439":30178,"46440":30171,"46441":30179,"46442":30169,"46443":30168,"46444":30174,"46445":30176,"46446":30331,"46447":30332,"46448":30358,"46449":30355,"46450":30388,"46451":30428,"46452":30543,"46453":30701,"46454":30813,"46455":30828,"46456":30831,"46457":31245,"46458":31240,"46459":31243,"46460":31237,"46461":31232,"46462":31384,"46497":31383,"46498":31382,"46499":31461,"46500":31459,"46501":31561,"46502":31574,"46503":31558,"46504":31568,"46505":31570,"46506":31572,"46507":31565,"46508":31563,"46509":31567,"46510":31569,"46511":31903,"46512":31909,"46513":32094,"46514":32080,"46515":32104,"46516":32085,"46517":32043,"46518":32110,"46519":32114,"46520":32097,"46521":32102,"46522":32098,"46523":32112,"46524":32115,"46525":21892,"46526":32724,"46527":32725,"46528":32779,"46529":32850,"46530":32901,"46531":33109,"46532":33108,"46533":33099,"46534":33105,"46535":33102,"46536":33081,"46537":33094,"46538":33086,"46539":33100,"46540":33107,"46541":33140,"46542":33298,"46543":33308,"46544":33769,"46545":33795,"46546":33784,"46547":33805,"46548":33760,"46549":33733,"46550":33803,"46551":33729,"46552":33775,"46553":33777,"46554":33780,"46555":33879,"46556":33802,"46557":33776,"46558":33804,"46559":33740,"46560":33789,"46561":33778,"46562":33738,"46563":33848,"46564":33806,"46565":33796,"46566":33756,"46567":33799,"46568":33748,"46569":33759,"46570":34395,"46571":34527,"46572":34521,"46573":34541,"46574":34516,"46575":34523,"46576":34532,"46577":34512,"46578":34526,"46579":34903,"46580":35009,"46581":35010,"46582":34993,"46583":35203,"46584":35222,"46585":35387,"46586":35424,"46587":35413,"46588":35422,"46589":35388,"46590":35393,"46656":35412,"46657":35419,"46658":35408,"46659":35398,"46660":35380,"46661":35386,"46662":35382,"46663":35414,"46664":35937,"46665":35970,"46666":36015,"46667":36028,"46668":36019,"46669":36029,"46670":36033,"46671":36027,"46672":36032,"46673":36020,"46674":36023,"46675":36022,"46676":36031,"46677":36024,"46678":36234,"46679":36229,"46680":36225,"46681":36302,"46682":36317,"46683":36299,"46684":36314,"46685":36305,"46686":36300,"46687":36315,"46688":36294,"46689":36603,"46690":36600,"46691":36604,"46692":36764,"46693":36910,"46694":36917,"46695":36913,"46696":36920,"46697":36914,"46698":36918,"46699":37122,"46700":37109,"46701":37129,"46702":37118,"46703":37219,"46704":37221,"46705":37327,"46706":37396,"46707":37397,"46708":37411,"46709":37385,"46710":37406,"46711":37389,"46712":37392,"46713":37383,"46714":37393,"46715":38292,"46716":38287,"46717":38283,"46718":38289,"46753":38291,"46754":38290,"46755":38286,"46756":38538,"46757":38542,"46758":38539,"46759":38525,"46760":38533,"46761":38534,"46762":38541,"46763":38514,"46764":38532,"46765":38593,"46766":38597,"46767":38596,"46768":38598,"46769":38599,"46770":38639,"46771":38642,"46772":38860,"46773":38917,"46774":38918,"46775":38920,"46776":39143,"46777":39146,"46778":39151,"46779":39145,"46780":39154,"46781":39149,"46782":39342,"46783":39341,"46784":40643,"46785":40653,"46786":40657,"46787":20098,"46788":20653,"46789":20661,"46790":20658,"46791":20659,"46792":20677,"46793":20670,"46794":20652,"46795":20663,"46796":20667,"46797":20655,"46798":20679,"46799":21119,"46800":21111,"46801":21117,"46802":21215,"46803":21222,"46804":21220,"46805":21218,"46806":21219,"46807":21295,"46808":21983,"46809":21992,"46810":21971,"46811":21990,"46812":21966,"46813":21980,"46814":21959,"46815":21969,"46816":21987,"46817":21988,"46818":21999,"46819":21978,"46820":21985,"46821":21957,"46822":21958,"46823":21989,"46824":21961,"46825":22290,"46826":22291,"46827":22622,"46828":22609,"46829":22616,"46830":22615,"46831":22618,"46832":22612,"46833":22635,"46834":22604,"46835":22637,"46836":22602,"46837":22626,"46838":22610,"46839":22603,"46840":22887,"46841":23233,"46842":23241,"46843":23244,"46844":23230,"46845":23229,"46846":23228,"46912":23219,"46913":23234,"46914":23218,"46915":23913,"46916":23919,"46917":24140,"46918":24185,"46919":24265,"46920":24264,"46921":24338,"46922":24409,"46923":24492,"46924":24494,"46925":24858,"46926":24847,"46927":24904,"46928":24863,"46929":24819,"46930":24859,"46931":24825,"46932":24833,"46933":24840,"46934":24910,"46935":24908,"46936":24900,"46937":24909,"46938":24894,"46939":24884,"46940":24871,"46941":24845,"46942":24838,"46943":24887,"46944":25121,"46945":25122,"46946":25619,"46947":25662,"46948":25630,"46949":25642,"46950":25645,"46951":25661,"46952":25644,"46953":25615,"46954":25628,"46955":25620,"46956":25613,"46957":25654,"46958":25622,"46959":25623,"46960":25606,"46961":25964,"46962":26015,"46963":26032,"46964":26263,"46965":26249,"46966":26247,"46967":26248,"46968":26262,"46969":26244,"46970":26264,"46971":26253,"46972":26371,"46973":27028,"46974":26989,"47009":26970,"47010":26999,"47011":26976,"47012":26964,"47013":26997,"47014":26928,"47015":27010,"47016":26954,"47017":26984,"47018":26987,"47019":26974,"47020":26963,"47021":27001,"47022":27014,"47023":26973,"47024":26979,"47025":26971,"47026":27463,"47027":27506,"47028":27584,"47029":27583,"47030":27603,"47031":27645,"47032":28322,"47033":28335,"47034":28371,"47035":28342,"47036":28354,"47037":28304,"47038":28317,"47039":28359,"47040":28357,"47041":28325,"47042":28312,"47043":28348,"47044":28346,"47045":28331,"47046":28369,"47047":28310,"47048":28316,"47049":28356,"47050":28372,"47051":28330,"47052":28327,"47053":28340,"47054":29006,"47055":29017,"47056":29033,"47057":29028,"47058":29001,"47059":29031,"47060":29020,"47061":29036,"47062":29030,"47063":29004,"47064":29029,"47065":29022,"47066":28998,"47067":29032,"47068":29014,"47069":29242,"47070":29266,"47071":29495,"47072":29509,"47073":29503,"47074":29502,"47075":29807,"47076":29786,"47077":29781,"47078":29791,"47079":29790,"47080":29761,"47081":29759,"47082":29785,"47083":29787,"47084":29788,"47085":30070,"47086":30072,"47087":30208,"47088":30192,"47089":30209,"47090":30194,"47091":30193,"47092":30202,"47093":30207,"47094":30196,"47095":30195,"47096":30430,"47097":30431,"47098":30555,"47099":30571,"47100":30566,"47101":30558,"47102":30563,"47168":30585,"47169":30570,"47170":30572,"47171":30556,"47172":30565,"47173":30568,"47174":30562,"47175":30702,"47176":30862,"47177":30896,"47178":30871,"47179":30872,"47180":30860,"47181":30857,"47182":30844,"47183":30865,"47184":30867,"47185":30847,"47186":31098,"47187":31103,"47188":31105,"47189":33836,"47190":31165,"47191":31260,"47192":31258,"47193":31264,"47194":31252,"47195":31263,"47196":31262,"47197":31391,"47198":31392,"47199":31607,"47200":31680,"47201":31584,"47202":31598,"47203":31591,"47204":31921,"47205":31923,"47206":31925,"47207":32147,"47208":32121,"47209":32145,"47210":32129,"47211":32143,"47212":32091,"47213":32622,"47214":32617,"47215":32618,"47216":32626,"47217":32681,"47218":32680,"47219":32676,"47220":32854,"47221":32856,"47222":32902,"47223":32900,"47224":33137,"47225":33136,"47226":33144,"47227":33125,"47228":33134,"47229":33139,"47230":33131,"47265":33145,"47266":33146,"47267":33126,"47268":33285,"47269":33351,"47270":33922,"47271":33911,"47272":33853,"47273":33841,"47274":33909,"47275":33894,"47276":33899,"47277":33865,"47278":33900,"47279":33883,"47280":33852,"47281":33845,"47282":33889,"47283":33891,"47284":33897,"47285":33901,"47286":33862,"47287":34398,"47288":34396,"47289":34399,"47290":34553,"47291":34579,"47292":34568,"47293":34567,"47294":34560,"47295":34558,"47296":34555,"47297":34562,"47298":34563,"47299":34566,"47300":34570,"47301":34905,"47302":35039,"47303":35028,"47304":35033,"47305":35036,"47306":35032,"47307":35037,"47308":35041,"47309":35018,"47310":35029,"47311":35026,"47312":35228,"47313":35299,"47314":35435,"47315":35442,"47316":35443,"47317":35430,"47318":35433,"47319":35440,"47320":35463,"47321":35452,"47322":35427,"47323":35488,"47324":35441,"47325":35461,"47326":35437,"47327":35426,"47328":35438,"47329":35436,"47330":35449,"47331":35451,"47332":35390,"47333":35432,"47334":35938,"47335":35978,"47336":35977,"47337":36042,"47338":36039,"47339":36040,"47340":36036,"47341":36018,"47342":36035,"47343":36034,"47344":36037,"47345":36321,"47346":36319,"47347":36328,"47348":36335,"47349":36339,"47350":36346,"47351":36330,"47352":36324,"47353":36326,"47354":36530,"47355":36611,"47356":36617,"47357":36606,"47358":36618,"47424":36767,"47425":36786,"47426":36939,"47427":36938,"47428":36947,"47429":36930,"47430":36948,"47431":36924,"47432":36949,"47433":36944,"47434":36935,"47435":36943,"47436":36942,"47437":36941,"47438":36945,"47439":36926,"47440":36929,"47441":37138,"47442":37143,"47443":37228,"47444":37226,"47445":37225,"47446":37321,"47447":37431,"47448":37463,"47449":37432,"47450":37437,"47451":37440,"47452":37438,"47453":37467,"47454":37451,"47455":37476,"47456":37457,"47457":37428,"47458":37449,"47459":37453,"47460":37445,"47461":37433,"47462":37439,"47463":37466,"47464":38296,"47465":38552,"47466":38548,"47467":38549,"47468":38605,"47469":38603,"47470":38601,"47471":38602,"47472":38647,"47473":38651,"47474":38649,"47475":38646,"47476":38742,"47477":38772,"47478":38774,"47479":38928,"47480":38929,"47481":38931,"47482":38922,"47483":38930,"47484":38924,"47485":39164,"47486":39156,"47521":39165,"47522":39166,"47523":39347,"47524":39345,"47525":39348,"47526":39649,"47527":40169,"47528":40578,"47529":40718,"47530":40723,"47531":40736,"47532":20711,"47533":20718,"47534":20709,"47535":20694,"47536":20717,"47537":20698,"47538":20693,"47539":20687,"47540":20689,"47541":20721,"47542":20686,"47543":20713,"47544":20834,"47545":20979,"47546":21123,"47547":21122,"47548":21297,"47549":21421,"47550":22014,"47551":22016,"47552":22043,"47553":22039,"47554":22013,"47555":22036,"47556":22022,"47557":22025,"47558":22029,"47559":22030,"47560":22007,"47561":22038,"47562":22047,"47563":22024,"47564":22032,"47565":22006,"47566":22296,"47567":22294,"47568":22645,"47569":22654,"47570":22659,"47571":22675,"47572":22666,"47573":22649,"47574":22661,"47575":22653,"47576":22781,"47577":22821,"47578":22818,"47579":22820,"47580":22890,"47581":22889,"47582":23265,"47583":23270,"47584":23273,"47585":23255,"47586":23254,"47587":23256,"47588":23267,"47589":23413,"47590":23518,"47591":23527,"47592":23521,"47593":23525,"47594":23526,"47595":23528,"47596":23522,"47597":23524,"47598":23519,"47599":23565,"47600":23650,"47601":23940,"47602":23943,"47603":24155,"47604":24163,"47605":24149,"47606":24151,"47607":24148,"47608":24275,"47609":24278,"47610":24330,"47611":24390,"47612":24432,"47613":24505,"47614":24903,"47680":24895,"47681":24907,"47682":24951,"47683":24930,"47684":24931,"47685":24927,"47686":24922,"47687":24920,"47688":24949,"47689":25130,"47690":25735,"47691":25688,"47692":25684,"47693":25764,"47694":25720,"47695":25695,"47696":25722,"47697":25681,"47698":25703,"47699":25652,"47700":25709,"47701":25723,"47702":25970,"47703":26017,"47704":26071,"47705":26070,"47706":26274,"47707":26280,"47708":26269,"47709":27036,"47710":27048,"47711":27029,"47712":27073,"47713":27054,"47714":27091,"47715":27083,"47716":27035,"47717":27063,"47718":27067,"47719":27051,"47720":27060,"47721":27088,"47722":27085,"47723":27053,"47724":27084,"47725":27046,"47726":27075,"47727":27043,"47728":27465,"47729":27468,"47730":27699,"47731":28467,"47732":28436,"47733":28414,"47734":28435,"47735":28404,"47736":28457,"47737":28478,"47738":28448,"47739":28460,"47740":28431,"47741":28418,"47742":28450,"47777":28415,"47778":28399,"47779":28422,"47780":28465,"47781":28472,"47782":28466,"47783":28451,"47784":28437,"47785":28459,"47786":28463,"47787":28552,"47788":28458,"47789":28396,"47790":28417,"47791":28402,"47792":28364,"47793":28407,"47794":29076,"47795":29081,"47796":29053,"47797":29066,"47798":29060,"47799":29074,"47800":29246,"47801":29330,"47802":29334,"47803":29508,"47804":29520,"47805":29796,"47806":29795,"47807":29802,"47808":29808,"47809":29805,"47810":29956,"47811":30097,"47812":30247,"47813":30221,"47814":30219,"47815":30217,"47816":30227,"47817":30433,"47818":30435,"47819":30596,"47820":30589,"47821":30591,"47822":30561,"47823":30913,"47824":30879,"47825":30887,"47826":30899,"47827":30889,"47828":30883,"47829":31118,"47830":31119,"47831":31117,"47832":31278,"47833":31281,"47834":31402,"47835":31401,"47836":31469,"47837":31471,"47838":31649,"47839":31637,"47840":31627,"47841":31605,"47842":31639,"47843":31645,"47844":31636,"47845":31631,"47846":31672,"47847":31623,"47848":31620,"47849":31929,"47850":31933,"47851":31934,"47852":32187,"47853":32176,"47854":32156,"47855":32189,"47856":32190,"47857":32160,"47858":32202,"47859":32180,"47860":32178,"47861":32177,"47862":32186,"47863":32162,"47864":32191,"47865":32181,"47866":32184,"47867":32173,"47868":32210,"47869":32199,"47870":32172,"47936":32624,"47937":32736,"47938":32737,"47939":32735,"47940":32862,"47941":32858,"47942":32903,"47943":33104,"47944":33152,"47945":33167,"47946":33160,"47947":33162,"47948":33151,"47949":33154,"47950":33255,"47951":33274,"47952":33287,"47953":33300,"47954":33310,"47955":33355,"47956":33993,"47957":33983,"47958":33990,"47959":33988,"47960":33945,"47961":33950,"47962":33970,"47963":33948,"47964":33995,"47965":33976,"47966":33984,"47967":34003,"47968":33936,"47969":33980,"47970":34001,"47971":33994,"47972":34623,"47973":34588,"47974":34619,"47975":34594,"47976":34597,"47977":34612,"47978":34584,"47979":34645,"47980":34615,"47981":34601,"47982":35059,"47983":35074,"47984":35060,"47985":35065,"47986":35064,"47987":35069,"47988":35048,"47989":35098,"47990":35055,"47991":35494,"47992":35468,"47993":35486,"47994":35491,"47995":35469,"47996":35489,"47997":35475,"47998":35492,"48033":35498,"48034":35493,"48035":35496,"48036":35480,"48037":35473,"48038":35482,"48039":35495,"48040":35946,"48041":35981,"48042":35980,"48043":36051,"48044":36049,"48045":36050,"48046":36203,"48047":36249,"48048":36245,"48049":36348,"48050":36628,"48051":36626,"48052":36629,"48053":36627,"48054":36771,"48055":36960,"48056":36952,"48057":36956,"48058":36963,"48059":36953,"48060":36958,"48061":36962,"48062":36957,"48063":36955,"48064":37145,"48065":37144,"48066":37150,"48067":37237,"48068":37240,"48069":37239,"48070":37236,"48071":37496,"48072":37504,"48073":37509,"48074":37528,"48075":37526,"48076":37499,"48077":37523,"48078":37532,"48079":37544,"48080":37500,"48081":37521,"48082":38305,"48083":38312,"48084":38313,"48085":38307,"48086":38309,"48087":38308,"48088":38553,"48089":38556,"48090":38555,"48091":38604,"48092":38610,"48093":38656,"48094":38780,"48095":38789,"48096":38902,"48097":38935,"48098":38936,"48099":39087,"48100":39089,"48101":39171,"48102":39173,"48103":39180,"48104":39177,"48105":39361,"48106":39599,"48107":39600,"48108":39654,"48109":39745,"48110":39746,"48111":40180,"48112":40182,"48113":40179,"48114":40636,"48115":40763,"48116":40778,"48117":20740,"48118":20736,"48119":20731,"48120":20725,"48121":20729,"48122":20738,"48123":20744,"48124":20745,"48125":20741,"48126":20956,"48192":21127,"48193":21128,"48194":21129,"48195":21133,"48196":21130,"48197":21232,"48198":21426,"48199":22062,"48200":22075,"48201":22073,"48202":22066,"48203":22079,"48204":22068,"48205":22057,"48206":22099,"48207":22094,"48208":22103,"48209":22132,"48210":22070,"48211":22063,"48212":22064,"48213":22656,"48214":22687,"48215":22686,"48216":22707,"48217":22684,"48218":22702,"48219":22697,"48220":22694,"48221":22893,"48222":23305,"48223":23291,"48224":23307,"48225":23285,"48226":23308,"48227":23304,"48228":23534,"48229":23532,"48230":23529,"48231":23531,"48232":23652,"48233":23653,"48234":23965,"48235":23956,"48236":24162,"48237":24159,"48238":24161,"48239":24290,"48240":24282,"48241":24287,"48242":24285,"48243":24291,"48244":24288,"48245":24392,"48246":24433,"48247":24503,"48248":24501,"48249":24950,"48250":24935,"48251":24942,"48252":24925,"48253":24917,"48254":24962,"48289":24956,"48290":24944,"48291":24939,"48292":24958,"48293":24999,"48294":24976,"48295":25003,"48296":24974,"48297":25004,"48298":24986,"48299":24996,"48300":24980,"48301":25006,"48302":25134,"48303":25705,"48304":25711,"48305":25721,"48306":25758,"48307":25778,"48308":25736,"48309":25744,"48310":25776,"48311":25765,"48312":25747,"48313":25749,"48314":25769,"48315":25746,"48316":25774,"48317":25773,"48318":25771,"48319":25754,"48320":25772,"48321":25753,"48322":25762,"48323":25779,"48324":25973,"48325":25975,"48326":25976,"48327":26286,"48328":26283,"48329":26292,"48330":26289,"48331":27171,"48332":27167,"48333":27112,"48334":27137,"48335":27166,"48336":27161,"48337":27133,"48338":27169,"48339":27155,"48340":27146,"48341":27123,"48342":27138,"48343":27141,"48344":27117,"48345":27153,"48346":27472,"48347":27470,"48348":27556,"48349":27589,"48350":27590,"48351":28479,"48352":28540,"48353":28548,"48354":28497,"48355":28518,"48356":28500,"48357":28550,"48358":28525,"48359":28507,"48360":28536,"48361":28526,"48362":28558,"48363":28538,"48364":28528,"48365":28516,"48366":28567,"48367":28504,"48368":28373,"48369":28527,"48370":28512,"48371":28511,"48372":29087,"48373":29100,"48374":29105,"48375":29096,"48376":29270,"48377":29339,"48378":29518,"48379":29527,"48380":29801,"48381":29835,"48382":29827,"48448":29822,"48449":29824,"48450":30079,"48451":30240,"48452":30249,"48453":30239,"48454":30244,"48455":30246,"48456":30241,"48457":30242,"48458":30362,"48459":30394,"48460":30436,"48461":30606,"48462":30599,"48463":30604,"48464":30609,"48465":30603,"48466":30923,"48467":30917,"48468":30906,"48469":30922,"48470":30910,"48471":30933,"48472":30908,"48473":30928,"48474":31295,"48475":31292,"48476":31296,"48477":31293,"48478":31287,"48479":31291,"48480":31407,"48481":31406,"48482":31661,"48483":31665,"48484":31684,"48485":31668,"48486":31686,"48487":31687,"48488":31681,"48489":31648,"48490":31692,"48491":31946,"48492":32224,"48493":32244,"48494":32239,"48495":32251,"48496":32216,"48497":32236,"48498":32221,"48499":32232,"48500":32227,"48501":32218,"48502":32222,"48503":32233,"48504":32158,"48505":32217,"48506":32242,"48507":32249,"48508":32629,"48509":32631,"48510":32687,"48545":32745,"48546":32806,"48547":33179,"48548":33180,"48549":33181,"48550":33184,"48551":33178,"48552":33176,"48553":34071,"48554":34109,"48555":34074,"48556":34030,"48557":34092,"48558":34093,"48559":34067,"48560":34065,"48561":34083,"48562":34081,"48563":34068,"48564":34028,"48565":34085,"48566":34047,"48567":34054,"48568":34690,"48569":34676,"48570":34678,"48571":34656,"48572":34662,"48573":34680,"48574":34664,"48575":34649,"48576":34647,"48577":34636,"48578":34643,"48579":34907,"48580":34909,"48581":35088,"48582":35079,"48583":35090,"48584":35091,"48585":35093,"48586":35082,"48587":35516,"48588":35538,"48589":35527,"48590":35524,"48591":35477,"48592":35531,"48593":35576,"48594":35506,"48595":35529,"48596":35522,"48597":35519,"48598":35504,"48599":35542,"48600":35533,"48601":35510,"48602":35513,"48603":35547,"48604":35916,"48605":35918,"48606":35948,"48607":36064,"48608":36062,"48609":36070,"48610":36068,"48611":36076,"48612":36077,"48613":36066,"48614":36067,"48615":36060,"48616":36074,"48617":36065,"48618":36205,"48619":36255,"48620":36259,"48621":36395,"48622":36368,"48623":36381,"48624":36386,"48625":36367,"48626":36393,"48627":36383,"48628":36385,"48629":36382,"48630":36538,"48631":36637,"48632":36635,"48633":36639,"48634":36649,"48635":36646,"48636":36650,"48637":36636,"48638":36638,"48704":36645,"48705":36969,"48706":36974,"48707":36968,"48708":36973,"48709":36983,"48710":37168,"48711":37165,"48712":37159,"48713":37169,"48714":37255,"48715":37257,"48716":37259,"48717":37251,"48718":37573,"48719":37563,"48720":37559,"48721":37610,"48722":37548,"48723":37604,"48724":37569,"48725":37555,"48726":37564,"48727":37586,"48728":37575,"48729":37616,"48730":37554,"48731":38317,"48732":38321,"48733":38660,"48734":38662,"48735":38663,"48736":38665,"48737":38752,"48738":38797,"48739":38795,"48740":38799,"48741":38945,"48742":38955,"48743":38940,"48744":39091,"48745":39178,"48746":39187,"48747":39186,"48748":39192,"48749":39389,"48750":39376,"48751":39391,"48752":39387,"48753":39377,"48754":39381,"48755":39378,"48756":39385,"48757":39607,"48758":39662,"48759":39663,"48760":39719,"48761":39749,"48762":39748,"48763":39799,"48764":39791,"48765":40198,"48766":40201,"48801":40195,"48802":40617,"48803":40638,"48804":40654,"48805":22696,"48806":40786,"48807":20754,"48808":20760,"48809":20756,"48810":20752,"48811":20757,"48812":20864,"48813":20906,"48814":20957,"48815":21137,"48816":21139,"48817":21235,"48818":22105,"48819":22123,"48820":22137,"48821":22121,"48822":22116,"48823":22136,"48824":22122,"48825":22120,"48826":22117,"48827":22129,"48828":22127,"48829":22124,"48830":22114,"48831":22134,"48832":22721,"48833":22718,"48834":22727,"48835":22725,"48836":22894,"48837":23325,"48838":23348,"48839":23416,"48840":23536,"48841":23566,"48842":24394,"48843":25010,"48844":24977,"48845":25001,"48846":24970,"48847":25037,"48848":25014,"48849":25022,"48850":25034,"48851":25032,"48852":25136,"48853":25797,"48854":25793,"48855":25803,"48856":25787,"48857":25788,"48858":25818,"48859":25796,"48860":25799,"48861":25794,"48862":25805,"48863":25791,"48864":25810,"48865":25812,"48866":25790,"48867":25972,"48868":26310,"48869":26313,"48870":26297,"48871":26308,"48872":26311,"48873":26296,"48874":27197,"48875":27192,"48876":27194,"48877":27225,"48878":27243,"48879":27224,"48880":27193,"48881":27204,"48882":27234,"48883":27233,"48884":27211,"48885":27207,"48886":27189,"48887":27231,"48888":27208,"48889":27481,"48890":27511,"48891":27653,"48892":28610,"48893":28593,"48894":28577,"48960":28611,"48961":28580,"48962":28609,"48963":28583,"48964":28595,"48965":28608,"48966":28601,"48967":28598,"48968":28582,"48969":28576,"48970":28596,"48971":29118,"48972":29129,"48973":29136,"48974":29138,"48975":29128,"48976":29141,"48977":29113,"48978":29134,"48979":29145,"48980":29148,"48981":29123,"48982":29124,"48983":29544,"48984":29852,"48985":29859,"48986":29848,"48987":29855,"48988":29854,"48989":29922,"48990":29964,"48991":29965,"48992":30260,"48993":30264,"48994":30266,"48995":30439,"48996":30437,"48997":30624,"48998":30622,"48999":30623,"49000":30629,"49001":30952,"49002":30938,"49003":30956,"49004":30951,"49005":31142,"49006":31309,"49007":31310,"49008":31302,"49009":31308,"49010":31307,"49011":31418,"49012":31705,"49013":31761,"49014":31689,"49015":31716,"49016":31707,"49017":31713,"49018":31721,"49019":31718,"49020":31957,"49021":31958,"49022":32266,"49057":32273,"49058":32264,"49059":32283,"49060":32291,"49061":32286,"49062":32285,"49063":32265,"49064":32272,"49065":32633,"49066":32690,"49067":32752,"49068":32753,"49069":32750,"49070":32808,"49071":33203,"49072":33193,"49073":33192,"49074":33275,"49075":33288,"49076":33368,"49077":33369,"49078":34122,"49079":34137,"49080":34120,"49081":34152,"49082":34153,"49083":34115,"49084":34121,"49085":34157,"49086":34154,"49087":34142,"49088":34691,"49089":34719,"49090":34718,"49091":34722,"49092":34701,"49093":34913,"49094":35114,"49095":35122,"49096":35109,"49097":35115,"49098":35105,"49099":35242,"49100":35238,"49101":35558,"49102":35578,"49103":35563,"49104":35569,"49105":35584,"49106":35548,"49107":35559,"49108":35566,"49109":35582,"49110":35585,"49111":35586,"49112":35575,"49113":35565,"49114":35571,"49115":35574,"49116":35580,"49117":35947,"49118":35949,"49119":35987,"49120":36084,"49121":36420,"49122":36401,"49123":36404,"49124":36418,"49125":36409,"49126":36405,"49127":36667,"49128":36655,"49129":36664,"49130":36659,"49131":36776,"49132":36774,"49133":36981,"49134":36980,"49135":36984,"49136":36978,"49137":36988,"49138":36986,"49139":37172,"49140":37266,"49141":37664,"49142":37686,"49143":37624,"49144":37683,"49145":37679,"49146":37666,"49147":37628,"49148":37675,"49149":37636,"49150":37658,"49216":37648,"49217":37670,"49218":37665,"49219":37653,"49220":37678,"49221":37657,"49222":38331,"49223":38567,"49224":38568,"49225":38570,"49226":38613,"49227":38670,"49228":38673,"49229":38678,"49230":38669,"49231":38675,"49232":38671,"49233":38747,"49234":38748,"49235":38758,"49236":38808,"49237":38960,"49238":38968,"49239":38971,"49240":38967,"49241":38957,"49242":38969,"49243":38948,"49244":39184,"49245":39208,"49246":39198,"49247":39195,"49248":39201,"49249":39194,"49250":39405,"49251":39394,"49252":39409,"49253":39608,"49254":39612,"49255":39675,"49256":39661,"49257":39720,"49258":39825,"49259":40213,"49260":40227,"49261":40230,"49262":40232,"49263":40210,"49264":40219,"49265":40664,"49266":40660,"49267":40845,"49268":40860,"49269":20778,"49270":20767,"49271":20769,"49272":20786,"49273":21237,"49274":22158,"49275":22144,"49276":22160,"49277":22149,"49278":22151,"49313":22159,"49314":22741,"49315":22739,"49316":22737,"49317":22734,"49318":23344,"49319":23338,"49320":23332,"49321":23418,"49322":23607,"49323":23656,"49324":23996,"49325":23994,"49326":23997,"49327":23992,"49328":24171,"49329":24396,"49330":24509,"49331":25033,"49332":25026,"49333":25031,"49334":25062,"49335":25035,"49336":25138,"49337":25140,"49338":25806,"49339":25802,"49340":25816,"49341":25824,"49342":25840,"49343":25830,"49344":25836,"49345":25841,"49346":25826,"49347":25837,"49348":25986,"49349":25987,"49350":26329,"49351":26326,"49352":27264,"49353":27284,"49354":27268,"49355":27298,"49356":27292,"49357":27355,"49358":27299,"49359":27262,"49360":27287,"49361":27280,"49362":27296,"49363":27484,"49364":27566,"49365":27610,"49366":27656,"49367":28632,"49368":28657,"49369":28639,"49370":28640,"49371":28635,"49372":28644,"49373":28651,"49374":28655,"49375":28544,"49376":28652,"49377":28641,"49378":28649,"49379":28629,"49380":28654,"49381":28656,"49382":29159,"49383":29151,"49384":29166,"49385":29158,"49386":29157,"49387":29165,"49388":29164,"49389":29172,"49390":29152,"49391":29237,"49392":29254,"49393":29552,"49394":29554,"49395":29865,"49396":29872,"49397":29862,"49398":29864,"49399":30278,"49400":30274,"49401":30284,"49402":30442,"49403":30643,"49404":30634,"49405":30640,"49406":30636,"49472":30631,"49473":30637,"49474":30703,"49475":30967,"49476":30970,"49477":30964,"49478":30959,"49479":30977,"49480":31143,"49481":31146,"49482":31319,"49483":31423,"49484":31751,"49485":31757,"49486":31742,"49487":31735,"49488":31756,"49489":31712,"49490":31968,"49491":31964,"49492":31966,"49493":31970,"49494":31967,"49495":31961,"49496":31965,"49497":32302,"49498":32318,"49499":32326,"49500":32311,"49501":32306,"49502":32323,"49503":32299,"49504":32317,"49505":32305,"49506":32325,"49507":32321,"49508":32308,"49509":32313,"49510":32328,"49511":32309,"49512":32319,"49513":32303,"49514":32580,"49515":32755,"49516":32764,"49517":32881,"49518":32882,"49519":32880,"49520":32879,"49521":32883,"49522":33222,"49523":33219,"49524":33210,"49525":33218,"49526":33216,"49527":33215,"49528":33213,"49529":33225,"49530":33214,"49531":33256,"49532":33289,"49533":33393,"49534":34218,"49569":34180,"49570":34174,"49571":34204,"49572":34193,"49573":34196,"49574":34223,"49575":34203,"49576":34183,"49577":34216,"49578":34186,"49579":34407,"49580":34752,"49581":34769,"49582":34739,"49583":34770,"49584":34758,"49585":34731,"49586":34747,"49587":34746,"49588":34760,"49589":34763,"49590":35131,"49591":35126,"49592":35140,"49593":35128,"49594":35133,"49595":35244,"49596":35598,"49597":35607,"49598":35609,"49599":35611,"49600":35594,"49601":35616,"49602":35613,"49603":35588,"49604":35600,"49605":35905,"49606":35903,"49607":35955,"49608":36090,"49609":36093,"49610":36092,"49611":36088,"49612":36091,"49613":36264,"49614":36425,"49615":36427,"49616":36424,"49617":36426,"49618":36676,"49619":36670,"49620":36674,"49621":36677,"49622":36671,"49623":36991,"49624":36989,"49625":36996,"49626":36993,"49627":36994,"49628":36992,"49629":37177,"49630":37283,"49631":37278,"49632":37276,"49633":37709,"49634":37762,"49635":37672,"49636":37749,"49637":37706,"49638":37733,"49639":37707,"49640":37656,"49641":37758,"49642":37740,"49643":37723,"49644":37744,"49645":37722,"49646":37716,"49647":38346,"49648":38347,"49649":38348,"49650":38344,"49651":38342,"49652":38577,"49653":38584,"49654":38614,"49655":38684,"49656":38686,"49657":38816,"49658":38867,"49659":38982,"49660":39094,"49661":39221,"49662":39425,"49728":39423,"49729":39854,"49730":39851,"49731":39850,"49732":39853,"49733":40251,"49734":40255,"49735":40587,"49736":40655,"49737":40670,"49738":40668,"49739":40669,"49740":40667,"49741":40766,"49742":40779,"49743":21474,"49744":22165,"49745":22190,"49746":22745,"49747":22744,"49748":23352,"49749":24413,"49750":25059,"49751":25139,"49752":25844,"49753":25842,"49754":25854,"49755":25862,"49756":25850,"49757":25851,"49758":25847,"49759":26039,"49760":26332,"49761":26406,"49762":27315,"49763":27308,"49764":27331,"49765":27323,"49766":27320,"49767":27330,"49768":27310,"49769":27311,"49770":27487,"49771":27512,"49772":27567,"49773":28681,"49774":28683,"49775":28670,"49776":28678,"49777":28666,"49778":28689,"49779":28687,"49780":29179,"49781":29180,"49782":29182,"49783":29176,"49784":29559,"49785":29557,"49786":29863,"49787":29887,"49788":29973,"49789":30294,"49790":30296,"49825":30290,"49826":30653,"49827":30655,"49828":30651,"49829":30652,"49830":30990,"49831":31150,"49832":31329,"49833":31330,"49834":31328,"49835":31428,"49836":31429,"49837":31787,"49838":31783,"49839":31786,"49840":31774,"49841":31779,"49842":31777,"49843":31975,"49844":32340,"49845":32341,"49846":32350,"49847":32346,"49848":32353,"49849":32338,"49850":32345,"49851":32584,"49852":32761,"49853":32763,"49854":32887,"49855":32886,"49856":33229,"49857":33231,"49858":33290,"49859":34255,"49860":34217,"49861":34253,"49862":34256,"49863":34249,"49864":34224,"49865":34234,"49866":34233,"49867":34214,"49868":34799,"49869":34796,"49870":34802,"49871":34784,"49872":35206,"49873":35250,"49874":35316,"49875":35624,"49876":35641,"49877":35628,"49878":35627,"49879":35920,"49880":36101,"49881":36441,"49882":36451,"49883":36454,"49884":36452,"49885":36447,"49886":36437,"49887":36544,"49888":36681,"49889":36685,"49890":36999,"49891":36995,"49892":37000,"49893":37291,"49894":37292,"49895":37328,"49896":37780,"49897":37770,"49898":37782,"49899":37794,"49900":37811,"49901":37806,"49902":37804,"49903":37808,"49904":37784,"49905":37786,"49906":37783,"49907":38356,"49908":38358,"49909":38352,"49910":38357,"49911":38626,"49912":38620,"49913":38617,"49914":38619,"49915":38622,"49916":38692,"49917":38819,"49918":38822,"49984":38829,"49985":38905,"49986":38989,"49987":38991,"49988":38988,"49989":38990,"49990":38995,"49991":39098,"49992":39230,"49993":39231,"49994":39229,"49995":39214,"49996":39333,"49997":39438,"49998":39617,"49999":39683,"50000":39686,"50001":39759,"50002":39758,"50003":39757,"50004":39882,"50005":39881,"50006":39933,"50007":39880,"50008":39872,"50009":40273,"50010":40285,"50011":40288,"50012":40672,"50013":40725,"50014":40748,"50015":20787,"50016":22181,"50017":22750,"50018":22751,"50019":22754,"50020":23541,"50021":40848,"50022":24300,"50023":25074,"50024":25079,"50025":25078,"50026":25077,"50027":25856,"50028":25871,"50029":26336,"50030":26333,"50031":27365,"50032":27357,"50033":27354,"50034":27347,"50035":28699,"50036":28703,"50037":28712,"50038":28698,"50039":28701,"50040":28693,"50041":28696,"50042":29190,"50043":29197,"50044":29272,"50045":29346,"50046":29560,"50081":29562,"50082":29885,"50083":29898,"50084":29923,"50085":30087,"50086":30086,"50087":30303,"50088":30305,"50089":30663,"50090":31001,"50091":31153,"50092":31339,"50093":31337,"50094":31806,"50095":31807,"50096":31800,"50097":31805,"50098":31799,"50099":31808,"50100":32363,"50101":32365,"50102":32377,"50103":32361,"50104":32362,"50105":32645,"50106":32371,"50107":32694,"50108":32697,"50109":32696,"50110":33240,"50111":34281,"50112":34269,"50113":34282,"50114":34261,"50115":34276,"50116":34277,"50117":34295,"50118":34811,"50119":34821,"50120":34829,"50121":34809,"50122":34814,"50123":35168,"50124":35167,"50125":35158,"50126":35166,"50127":35649,"50128":35676,"50129":35672,"50130":35657,"50131":35674,"50132":35662,"50133":35663,"50134":35654,"50135":35673,"50136":36104,"50137":36106,"50138":36476,"50139":36466,"50140":36487,"50141":36470,"50142":36460,"50143":36474,"50144":36468,"50145":36692,"50146":36686,"50147":36781,"50148":37002,"50149":37003,"50150":37297,"50151":37294,"50152":37857,"50153":37841,"50154":37855,"50155":37827,"50156":37832,"50157":37852,"50158":37853,"50159":37846,"50160":37858,"50161":37837,"50162":37848,"50163":37860,"50164":37847,"50165":37864,"50166":38364,"50167":38580,"50168":38627,"50169":38698,"50170":38695,"50171":38753,"50172":38876,"50173":38907,"50174":39006,"50240":39000,"50241":39003,"50242":39100,"50243":39237,"50244":39241,"50245":39446,"50246":39449,"50247":39693,"50248":39912,"50249":39911,"50250":39894,"50251":39899,"50252":40329,"50253":40289,"50254":40306,"50255":40298,"50256":40300,"50257":40594,"50258":40599,"50259":40595,"50260":40628,"50261":21240,"50262":22184,"50263":22199,"50264":22198,"50265":22196,"50266":22204,"50267":22756,"50268":23360,"50269":23363,"50270":23421,"50271":23542,"50272":24009,"50273":25080,"50274":25082,"50275":25880,"50276":25876,"50277":25881,"50278":26342,"50279":26407,"50280":27372,"50281":28734,"50282":28720,"50283":28722,"50284":29200,"50285":29563,"50286":29903,"50287":30306,"50288":30309,"50289":31014,"50290":31018,"50291":31020,"50292":31019,"50293":31431,"50294":31478,"50295":31820,"50296":31811,"50297":31821,"50298":31983,"50299":31984,"50300":36782,"50301":32381,"50302":32380,"50337":32386,"50338":32588,"50339":32768,"50340":33242,"50341":33382,"50342":34299,"50343":34297,"50344":34321,"50345":34298,"50346":34310,"50347":34315,"50348":34311,"50349":34314,"50350":34836,"50351":34837,"50352":35172,"50353":35258,"50354":35320,"50355":35696,"50356":35692,"50357":35686,"50358":35695,"50359":35679,"50360":35691,"50361":36111,"50362":36109,"50363":36489,"50364":36481,"50365":36485,"50366":36482,"50367":37300,"50368":37323,"50369":37912,"50370":37891,"50371":37885,"50372":38369,"50373":38704,"50374":39108,"50375":39250,"50376":39249,"50377":39336,"50378":39467,"50379":39472,"50380":39479,"50381":39477,"50382":39955,"50383":39949,"50384":40569,"50385":40629,"50386":40680,"50387":40751,"50388":40799,"50389":40803,"50390":40801,"50391":20791,"50392":20792,"50393":22209,"50394":22208,"50395":22210,"50396":22804,"50397":23660,"50398":24013,"50399":25084,"50400":25086,"50401":25885,"50402":25884,"50403":26005,"50404":26345,"50405":27387,"50406":27396,"50407":27386,"50408":27570,"50409":28748,"50410":29211,"50411":29351,"50412":29910,"50413":29908,"50414":30313,"50415":30675,"50416":31824,"50417":32399,"50418":32396,"50419":32700,"50420":34327,"50421":34349,"50422":34330,"50423":34851,"50424":34850,"50425":34849,"50426":34847,"50427":35178,"50428":35180,"50429":35261,"50430":35700,"50496":35703,"50497":35709,"50498":36115,"50499":36490,"50500":36493,"50501":36491,"50502":36703,"50503":36783,"50504":37306,"50505":37934,"50506":37939,"50507":37941,"50508":37946,"50509":37944,"50510":37938,"50511":37931,"50512":38370,"50513":38712,"50514":38713,"50515":38706,"50516":38911,"50517":39015,"50518":39013,"50519":39255,"50520":39493,"50521":39491,"50522":39488,"50523":39486,"50524":39631,"50525":39764,"50526":39761,"50527":39981,"50528":39973,"50529":40367,"50530":40372,"50531":40386,"50532":40376,"50533":40605,"50534":40687,"50535":40729,"50536":40796,"50537":40806,"50538":40807,"50539":20796,"50540":20795,"50541":22216,"50542":22218,"50543":22217,"50544":23423,"50545":24020,"50546":24018,"50547":24398,"50548":25087,"50549":25892,"50550":27402,"50551":27489,"50552":28753,"50553":28760,"50554":29568,"50555":29924,"50556":30090,"50557":30318,"50558":30316,"50593":31155,"50594":31840,"50595":31839,"50596":32894,"50597":32893,"50598":33247,"50599":35186,"50600":35183,"50601":35324,"50602":35712,"50603":36118,"50604":36119,"50605":36497,"50606":36499,"50607":36705,"50608":37192,"50609":37956,"50610":37969,"50611":37970,"50612":38717,"50613":38718,"50614":38851,"50615":38849,"50616":39019,"50617":39253,"50618":39509,"50619":39501,"50620":39634,"50621":39706,"50622":40009,"50623":39985,"50624":39998,"50625":39995,"50626":40403,"50627":40407,"50628":40756,"50629":40812,"50630":40810,"50631":40852,"50632":22220,"50633":24022,"50634":25088,"50635":25891,"50636":25899,"50637":25898,"50638":26348,"50639":27408,"50640":29914,"50641":31434,"50642":31844,"50643":31843,"50644":31845,"50645":32403,"50646":32406,"50647":32404,"50648":33250,"50649":34360,"50650":34367,"50651":34865,"50652":35722,"50653":37008,"50654":37007,"50655":37987,"50656":37984,"50657":37988,"50658":38760,"50659":39023,"50660":39260,"50661":39514,"50662":39515,"50663":39511,"50664":39635,"50665":39636,"50666":39633,"50667":40020,"50668":40023,"50669":40022,"50670":40421,"50671":40607,"50672":40692,"50673":22225,"50674":22761,"50675":25900,"50676":28766,"50677":30321,"50678":30322,"50679":30679,"50680":32592,"50681":32648,"50682":34870,"50683":34873,"50684":34914,"50685":35731,"50686":35730,"50752":35734,"50753":33399,"50754":36123,"50755":37312,"50756":37994,"50757":38722,"50758":38728,"50759":38724,"50760":38854,"50761":39024,"50762":39519,"50763":39714,"50764":39768,"50765":40031,"50766":40441,"50767":40442,"50768":40572,"50769":40573,"50770":40711,"50771":40823,"50772":40818,"50773":24307,"50774":27414,"50775":28771,"50776":31852,"50777":31854,"50778":34875,"50779":35264,"50780":36513,"50781":37313,"50782":38002,"50783":38000,"50784":39025,"50785":39262,"50786":39638,"50787":39715,"50788":40652,"50789":28772,"50790":30682,"50791":35738,"50792":38007,"50793":38857,"50794":39522,"50795":39525,"50796":32412,"50797":35740,"50798":36522,"50799":37317,"50800":38013,"50801":38014,"50802":38012,"50803":40055,"50804":40056,"50805":40695,"50806":35924,"50807":38015,"50808":40474,"50809":29224,"50810":39530,"50811":39729,"50812":40475,"50813":40478,"50814":31858,"50849":9312,"50850":9313,"50851":9314,"50852":9315,"50853":9316,"50854":9317,"50855":9318,"50856":9319,"50857":9320,"50858":9321,"50859":9332,"50860":9333,"50861":9334,"50862":9335,"50863":9336,"50864":9337,"50865":9338,"50866":9339,"50867":9340,"50868":9341,"50869":8560,"50870":8561,"50871":8562,"50872":8563,"50873":8564,"50874":8565,"50875":8566,"50876":8567,"50877":8568,"50878":8569,"50879":20022,"50880":20031,"50881":20101,"50882":20128,"50883":20866,"50884":20886,"50885":20907,"50886":21241,"50887":21304,"50888":21353,"50889":21430,"50890":22794,"50891":23424,"50892":24027,"50893":24186,"50894":24191,"50895":24308,"50896":24400,"50897":24417,"50898":25908,"50899":26080,"50900":30098,"50901":30326,"50902":36789,"50903":38582,"50904":168,"50905":710,"50906":12541,"50907":12542,"50908":12445,"50909":12446,"50910":12291,"50911":20189,"50912":12293,"50913":12294,"50914":12295,"50915":12540,"50916":65339,"50917":65341,"50918":10045,"50919":12353,"50920":12354,"50921":12355,"50922":12356,"50923":12357,"50924":12358,"50925":12359,"50926":12360,"50927":12361,"50928":12362,"50929":12363,"50930":12364,"50931":12365,"50932":12366,"50933":12367,"50934":12368,"50935":12369,"50936":12370,"50937":12371,"50938":12372,"50939":12373,"50940":12374,"50941":12375,"50942":12376,"51008":12377,"51009":12378,"51010":12379,"51011":12380,"51012":12381,"51013":12382,"51014":12383,"51015":12384,"51016":12385,"51017":12386,"51018":12387,"51019":12388,"51020":12389,"51021":12390,"51022":12391,"51023":12392,"51024":12393,"51025":12394,"51026":12395,"51027":12396,"51028":12397,"51029":12398,"51030":12399,"51031":12400,"51032":12401,"51033":12402,"51034":12403,"51035":12404,"51036":12405,"51037":12406,"51038":12407,"51039":12408,"51040":12409,"51041":12410,"51042":12411,"51043":12412,"51044":12413,"51045":12414,"51046":12415,"51047":12416,"51048":12417,"51049":12418,"51050":12419,"51051":12420,"51052":12421,"51053":12422,"51054":12423,"51055":12424,"51056":12425,"51057":12426,"51058":12427,"51059":12428,"51060":12429,"51061":12430,"51062":12431,"51063":12432,"51064":12433,"51065":12434,"51066":12435,"51067":12449,"51068":12450,"51069":12451,"51070":12452,"51105":12453,"51106":12454,"51107":12455,"51108":12456,"51109":12457,"51110":12458,"51111":12459,"51112":12460,"51113":12461,"51114":12462,"51115":12463,"51116":12464,"51117":12465,"51118":12466,"51119":12467,"51120":12468,"51121":12469,"51122":12470,"51123":12471,"51124":12472,"51125":12473,"51126":12474,"51127":12475,"51128":12476,"51129":12477,"51130":12478,"51131":12479,"51132":12480,"51133":12481,"51134":12482,"51135":12483,"51136":12484,"51137":12485,"51138":12486,"51139":12487,"51140":12488,"51141":12489,"51142":12490,"51143":12491,"51144":12492,"51145":12493,"51146":12494,"51147":12495,"51148":12496,"51149":12497,"51150":12498,"51151":12499,"51152":12500,"51153":12501,"51154":12502,"51155":12503,"51156":12504,"51157":12505,"51158":12506,"51159":12507,"51160":12508,"51161":12509,"51162":12510,"51163":12511,"51164":12512,"51165":12513,"51166":12514,"51167":12515,"51168":12516,"51169":12517,"51170":12518,"51171":12519,"51172":12520,"51173":12521,"51174":12522,"51175":12523,"51176":12524,"51177":12525,"51178":12526,"51179":12527,"51180":12528,"51181":12529,"51182":12530,"51183":12531,"51184":12532,"51185":12533,"51186":12534,"51187":1040,"51188":1041,"51189":1042,"51190":1043,"51191":1044,"51192":1045,"51193":1025,"51194":1046,"51195":1047,"51196":1048,"51197":1049,"51198":1050,"51264":1051,"51265":1052,"51266":1053,"51267":1054,"51268":1055,"51269":1056,"51270":1057,"51271":1058,"51272":1059,"51273":1060,"51274":1061,"51275":1062,"51276":1063,"51277":1064,"51278":1065,"51279":1066,"51280":1067,"51281":1068,"51282":1069,"51283":1070,"51284":1071,"51285":1072,"51286":1073,"51287":1074,"51288":1075,"51289":1076,"51290":1077,"51291":1105,"51292":1078,"51293":1079,"51294":1080,"51295":1081,"51296":1082,"51297":1083,"51298":1084,"51299":1085,"51300":1086,"51301":1087,"51302":1088,"51303":1089,"51304":1090,"51305":1091,"51306":1092,"51307":1093,"51308":1094,"51309":1095,"51310":1096,"51311":1097,"51312":1098,"51313":1099,"51314":1100,"51315":1101,"51316":1102,"51317":1103,"51318":8679,"51319":8632,"51320":8633,"51321":12751,"51322":63462,"51323":20058,"51324":63464,"51325":20994,"51326":17553,"51361":40880,"51362":20872,"51363":40881,"51364":63470,"51365":63471,"51366":63472,"51367":63473,"51368":63474,"51369":63475,"51370":63476,"51371":63477,"51372":63478,"51373":63479,"51374":63480,"51375":63481,"51376":63482,"51377":12443,"51378":12444,"51379":12436,"51380":12535,"51381":12536,"51382":12537,"51383":12538,"51384":12539,"51385":65377,"51386":65378,"51387":65379,"51388":65380,"51389":65381,"51390":65382,"51391":65383,"51392":65384,"51393":65385,"51394":65386,"51395":65387,"51396":65388,"51397":65389,"51398":65390,"51399":65391,"51400":65392,"51401":65393,"51402":65394,"51403":65395,"51404":65396,"51405":65506,"51406":65508,"51407":65287,"51408":65282,"51409":12849,"51410":8470,"51411":8481,"51412":65397,"51413":65398,"51414":65399,"51415":65400,"51416":65401,"51417":65402,"51418":65403,"51419":65404,"51420":65405,"51421":65406,"51422":65407,"51423":65408,"51424":65409,"51425":65410,"51426":65411,"51427":65412,"51428":65413,"51429":65414,"51430":65415,"51431":65416,"51432":65417,"51433":65418,"51434":65419,"51435":65420,"51436":65421,"51437":65422,"51438":65423,"51439":65424,"51440":65425,"51441":65426,"51442":65427,"51443":65428,"51444":65429,"51445":65430,"51446":65431,"51447":65432,"51448":65433,"51449":65434,"51450":65435,"51451":65436,"51452":65437,"51453":65438,"51454":65439,"51520":20034,"51521":20060,"51522":20981,"51523":21274,"51524":21378,"51525":19975,"51526":19980,"51527":20039,"51528":20109,"51529":22231,"51530":64012,"51531":23662,"51532":24435,"51533":19983,"51534":20871,"51535":19982,"51536":20014,"51537":20115,"51538":20162,"51539":20169,"51540":20168,"51541":20888,"51542":21244,"51543":21356,"51544":21433,"51545":22304,"51546":22787,"51547":22828,"51548":23568,"51549":24063,"51550":26081,"51551":27571,"51552":27596,"51553":27668,"51554":29247,"51555":20017,"51556":20028,"51557":20200,"51558":20188,"51559":20201,"51560":20193,"51561":20189,"51562":20186,"51563":21004,"51564":21276,"51565":21324,"51566":22306,"51567":22307,"51568":22807,"51569":22831,"51570":23425,"51571":23428,"51572":23570,"51573":23611,"51574":23668,"51575":23667,"51576":24068,"51577":24192,"51578":24194,"51579":24521,"51580":25097,"51581":25168,"51582":27669,"51617":27702,"51618":27715,"51619":27711,"51620":27707,"51621":29358,"51622":29360,"51623":29578,"51624":31160,"51625":32906,"51626":38430,"51627":20238,"51628":20248,"51629":20268,"51630":20213,"51631":20244,"51632":20209,"51633":20224,"51634":20215,"51635":20232,"51636":20253,"51637":20226,"51638":20229,"51639":20258,"51640":20243,"51641":20228,"51642":20212,"51643":20242,"51644":20913,"51645":21011,"51646":21001,"51647":21008,"51648":21158,"51649":21282,"51650":21279,"51651":21325,"51652":21386,"51653":21511,"51654":22241,"51655":22239,"51656":22318,"51657":22314,"51658":22324,"51659":22844,"51660":22912,"51661":22908,"51662":22917,"51663":22907,"51664":22910,"51665":22903,"51666":22911,"51667":23382,"51668":23573,"51669":23589,"51670":23676,"51671":23674,"51672":23675,"51673":23678,"51674":24031,"51675":24181,"51676":24196,"51677":24322,"51678":24346,"51679":24436,"51680":24533,"51681":24532,"51682":24527,"51683":25180,"51684":25182,"51685":25188,"51686":25185,"51687":25190,"51688":25186,"51689":25177,"51690":25184,"51691":25178,"51692":25189,"51693":26095,"51694":26094,"51695":26430,"51696":26425,"51697":26424,"51698":26427,"51699":26426,"51700":26431,"51701":26428,"51702":26419,"51703":27672,"51704":27718,"51705":27730,"51706":27740,"51707":27727,"51708":27722,"51709":27732,"51710":27723,"51776":27724,"51777":28785,"51778":29278,"51779":29364,"51780":29365,"51781":29582,"51782":29994,"51783":30335,"51784":31349,"51785":32593,"51786":33400,"51787":33404,"51788":33408,"51789":33405,"51790":33407,"51791":34381,"51792":35198,"51793":37017,"51794":37015,"51795":37016,"51796":37019,"51797":37012,"51798":38434,"51799":38436,"51800":38432,"51801":38435,"51802":20310,"51803":20283,"51804":20322,"51805":20297,"51806":20307,"51807":20324,"51808":20286,"51809":20327,"51810":20306,"51811":20319,"51812":20289,"51813":20312,"51814":20269,"51815":20275,"51816":20287,"51817":20321,"51818":20879,"51819":20921,"51820":21020,"51821":21022,"51822":21025,"51823":21165,"51824":21166,"51825":21257,"51826":21347,"51827":21362,"51828":21390,"51829":21391,"51830":21552,"51831":21559,"51832":21546,"51833":21588,"51834":21573,"51835":21529,"51836":21532,"51837":21541,"51838":21528,"51873":21565,"51874":21583,"51875":21569,"51876":21544,"51877":21540,"51878":21575,"51879":22254,"51880":22247,"51881":22245,"51882":22337,"51883":22341,"51884":22348,"51885":22345,"51886":22347,"51887":22354,"51888":22790,"51889":22848,"51890":22950,"51891":22936,"51892":22944,"51893":22935,"51894":22926,"51895":22946,"51896":22928,"51897":22927,"51898":22951,"51899":22945,"51900":23438,"51901":23442,"51902":23592,"51903":23594,"51904":23693,"51905":23695,"51906":23688,"51907":23691,"51908":23689,"51909":23698,"51910":23690,"51911":23686,"51912":23699,"51913":23701,"51914":24032,"51915":24074,"51916":24078,"51917":24203,"51918":24201,"51919":24204,"51920":24200,"51921":24205,"51922":24325,"51923":24349,"51924":24440,"51925":24438,"51926":24530,"51927":24529,"51928":24528,"51929":24557,"51930":24552,"51931":24558,"51932":24563,"51933":24545,"51934":24548,"51935":24547,"51936":24570,"51937":24559,"51938":24567,"51939":24571,"51940":24576,"51941":24564,"51942":25146,"51943":25219,"51944":25228,"51945":25230,"51946":25231,"51947":25236,"51948":25223,"51949":25201,"51950":25211,"51951":25210,"51952":25200,"51953":25217,"51954":25224,"51955":25207,"51956":25213,"51957":25202,"51958":25204,"51959":25911,"51960":26096,"51961":26100,"51962":26099,"51963":26098,"51964":26101,"51965":26437,"51966":26439,"52032":26457,"52033":26453,"52034":26444,"52035":26440,"52036":26461,"52037":26445,"52038":26458,"52039":26443,"52040":27600,"52041":27673,"52042":27674,"52043":27768,"52044":27751,"52045":27755,"52046":27780,"52047":27787,"52048":27791,"52049":27761,"52050":27759,"52051":27753,"52052":27802,"52053":27757,"52054":27783,"52055":27797,"52056":27804,"52057":27750,"52058":27763,"52059":27749,"52060":27771,"52061":27790,"52062":28788,"52063":28794,"52064":29283,"52065":29375,"52066":29373,"52067":29379,"52068":29382,"52069":29377,"52070":29370,"52071":29381,"52072":29589,"52073":29591,"52074":29587,"52075":29588,"52076":29586,"52077":30010,"52078":30009,"52079":30100,"52080":30101,"52081":30337,"52082":31037,"52083":32820,"52084":32917,"52085":32921,"52086":32912,"52087":32914,"52088":32924,"52089":33424,"52090":33423,"52091":33413,"52092":33422,"52093":33425,"52094":33427,"52129":33418,"52130":33411,"52131":33412,"52132":35960,"52133":36809,"52134":36799,"52135":37023,"52136":37025,"52137":37029,"52138":37022,"52139":37031,"52140":37024,"52141":38448,"52142":38440,"52143":38447,"52144":38445,"52145":20019,"52146":20376,"52147":20348,"52148":20357,"52149":20349,"52150":20352,"52151":20359,"52152":20342,"52153":20340,"52154":20361,"52155":20356,"52156":20343,"52157":20300,"52158":20375,"52159":20330,"52160":20378,"52161":20345,"52162":20353,"52163":20344,"52164":20368,"52165":20380,"52166":20372,"52167":20382,"52168":20370,"52169":20354,"52170":20373,"52171":20331,"52172":20334,"52173":20894,"52174":20924,"52175":20926,"52176":21045,"52177":21042,"52178":21043,"52179":21062,"52180":21041,"52181":21180,"52182":21258,"52183":21259,"52184":21308,"52185":21394,"52186":21396,"52187":21639,"52188":21631,"52189":21633,"52190":21649,"52191":21634,"52192":21640,"52193":21611,"52194":21626,"52195":21630,"52196":21605,"52197":21612,"52198":21620,"52199":21606,"52200":21645,"52201":21615,"52202":21601,"52203":21600,"52204":21656,"52205":21603,"52206":21607,"52207":21604,"52208":22263,"52209":22265,"52210":22383,"52211":22386,"52212":22381,"52213":22379,"52214":22385,"52215":22384,"52216":22390,"52217":22400,"52218":22389,"52219":22395,"52220":22387,"52221":22388,"52222":22370,"52288":22376,"52289":22397,"52290":22796,"52291":22853,"52292":22965,"52293":22970,"52294":22991,"52295":22990,"52296":22962,"52297":22988,"52298":22977,"52299":22966,"52300":22972,"52301":22979,"52302":22998,"52303":22961,"52304":22973,"52305":22976,"52306":22984,"52307":22964,"52308":22983,"52309":23394,"52310":23397,"52311":23443,"52312":23445,"52313":23620,"52314":23623,"52315":23726,"52316":23716,"52317":23712,"52318":23733,"52319":23727,"52320":23720,"52321":23724,"52322":23711,"52323":23715,"52324":23725,"52325":23714,"52326":23722,"52327":23719,"52328":23709,"52329":23717,"52330":23734,"52331":23728,"52332":23718,"52333":24087,"52334":24084,"52335":24089,"52336":24360,"52337":24354,"52338":24355,"52339":24356,"52340":24404,"52341":24450,"52342":24446,"52343":24445,"52344":24542,"52345":24549,"52346":24621,"52347":24614,"52348":24601,"52349":24626,"52350":24587,"52385":24628,"52386":24586,"52387":24599,"52388":24627,"52389":24602,"52390":24606,"52391":24620,"52392":24610,"52393":24589,"52394":24592,"52395":24622,"52396":24595,"52397":24593,"52398":24588,"52399":24585,"52400":24604,"52401":25108,"52402":25149,"52403":25261,"52404":25268,"52405":25297,"52406":25278,"52407":25258,"52408":25270,"52409":25290,"52410":25262,"52411":25267,"52412":25263,"52413":25275,"52414":25257,"52415":25264,"52416":25272,"52417":25917,"52418":26024,"52419":26043,"52420":26121,"52421":26108,"52422":26116,"52423":26130,"52424":26120,"52425":26107,"52426":26115,"52427":26123,"52428":26125,"52429":26117,"52430":26109,"52431":26129,"52432":26128,"52433":26358,"52434":26378,"52435":26501,"52436":26476,"52437":26510,"52438":26514,"52439":26486,"52440":26491,"52441":26520,"52442":26502,"52443":26500,"52444":26484,"52445":26509,"52446":26508,"52447":26490,"52448":26527,"52449":26513,"52450":26521,"52451":26499,"52452":26493,"52453":26497,"52454":26488,"52455":26489,"52456":26516,"52457":27429,"52458":27520,"52459":27518,"52460":27614,"52461":27677,"52462":27795,"52463":27884,"52464":27883,"52465":27886,"52466":27865,"52467":27830,"52468":27860,"52469":27821,"52470":27879,"52471":27831,"52472":27856,"52473":27842,"52474":27834,"52475":27843,"52476":27846,"52477":27885,"52478":27890,"52544":27858,"52545":27869,"52546":27828,"52547":27786,"52548":27805,"52549":27776,"52550":27870,"52551":27840,"52552":27952,"52553":27853,"52554":27847,"52555":27824,"52556":27897,"52557":27855,"52558":27881,"52559":27857,"52560":28820,"52561":28824,"52562":28805,"52563":28819,"52564":28806,"52565":28804,"52566":28817,"52567":28822,"52568":28802,"52569":28826,"52570":28803,"52571":29290,"52572":29398,"52573":29387,"52574":29400,"52575":29385,"52576":29404,"52577":29394,"52578":29396,"52579":29402,"52580":29388,"52581":29393,"52582":29604,"52583":29601,"52584":29613,"52585":29606,"52586":29602,"52587":29600,"52588":29612,"52589":29597,"52590":29917,"52591":29928,"52592":30015,"52593":30016,"52594":30014,"52595":30092,"52596":30104,"52597":30383,"52598":30451,"52599":30449,"52600":30448,"52601":30453,"52602":30712,"52603":30716,"52604":30713,"52605":30715,"52606":30714,"52641":30711,"52642":31042,"52643":31039,"52644":31173,"52645":31352,"52646":31355,"52647":31483,"52648":31861,"52649":31997,"52650":32821,"52651":32911,"52652":32942,"52653":32931,"52654":32952,"52655":32949,"52656":32941,"52657":33312,"52658":33440,"52659":33472,"52660":33451,"52661":33434,"52662":33432,"52663":33435,"52664":33461,"52665":33447,"52666":33454,"52667":33468,"52668":33438,"52669":33466,"52670":33460,"52671":33448,"52672":33441,"52673":33449,"52674":33474,"52675":33444,"52676":33475,"52677":33462,"52678":33442,"52679":34416,"52680":34415,"52681":34413,"52682":34414,"52683":35926,"52684":36818,"52685":36811,"52686":36819,"52687":36813,"52688":36822,"52689":36821,"52690":36823,"52691":37042,"52692":37044,"52693":37039,"52694":37043,"52695":37040,"52696":38457,"52697":38461,"52698":38460,"52699":38458,"52700":38467,"52701":20429,"52702":20421,"52703":20435,"52704":20402,"52705":20425,"52706":20427,"52707":20417,"52708":20436,"52709":20444,"52710":20441,"52711":20411,"52712":20403,"52713":20443,"52714":20423,"52715":20438,"52716":20410,"52717":20416,"52718":20409,"52719":20460,"52720":21060,"52721":21065,"52722":21184,"52723":21186,"52724":21309,"52725":21372,"52726":21399,"52727":21398,"52728":21401,"52729":21400,"52730":21690,"52731":21665,"52732":21677,"52733":21669,"52734":21711,"52800":21699,"52801":33549,"52802":21687,"52803":21678,"52804":21718,"52805":21686,"52806":21701,"52807":21702,"52808":21664,"52809":21616,"52810":21692,"52811":21666,"52812":21694,"52813":21618,"52814":21726,"52815":21680,"52816":22453,"52817":22430,"52818":22431,"52819":22436,"52820":22412,"52821":22423,"52822":22429,"52823":22427,"52824":22420,"52825":22424,"52826":22415,"52827":22425,"52828":22437,"52829":22426,"52830":22421,"52831":22772,"52832":22797,"52833":22867,"52834":23009,"52835":23006,"52836":23022,"52837":23040,"52838":23025,"52839":23005,"52840":23034,"52841":23037,"52842":23036,"52843":23030,"52844":23012,"52845":23026,"52846":23031,"52847":23003,"52848":23017,"52849":23027,"52850":23029,"52851":23008,"52852":23038,"52853":23028,"52854":23021,"52855":23464,"52856":23628,"52857":23760,"52858":23768,"52859":23756,"52860":23767,"52861":23755,"52862":23771,"52897":23774,"52898":23770,"52899":23753,"52900":23751,"52901":23754,"52902":23766,"52903":23763,"52904":23764,"52905":23759,"52906":23752,"52907":23750,"52908":23758,"52909":23775,"52910":23800,"52911":24057,"52912":24097,"52913":24098,"52914":24099,"52915":24096,"52916":24100,"52917":24240,"52918":24228,"52919":24226,"52920":24219,"52921":24227,"52922":24229,"52923":24327,"52924":24366,"52925":24406,"52926":24454,"52927":24631,"52928":24633,"52929":24660,"52930":24690,"52931":24670,"52932":24645,"52933":24659,"52934":24647,"52935":24649,"52936":24667,"52937":24652,"52938":24640,"52939":24642,"52940":24671,"52941":24612,"52942":24644,"52943":24664,"52944":24678,"52945":24686,"52946":25154,"52947":25155,"52948":25295,"52949":25357,"52950":25355,"52951":25333,"52952":25358,"52953":25347,"52954":25323,"52955":25337,"52956":25359,"52957":25356,"52958":25336,"52959":25334,"52960":25344,"52961":25363,"52962":25364,"52963":25338,"52964":25365,"52965":25339,"52966":25328,"52967":25921,"52968":25923,"52969":26026,"52970":26047,"52971":26166,"52972":26145,"52973":26162,"52974":26165,"52975":26140,"52976":26150,"52977":26146,"52978":26163,"52979":26155,"52980":26170,"52981":26141,"52982":26164,"52983":26169,"52984":26158,"52985":26383,"52986":26384,"52987":26561,"52988":26610,"52989":26568,"52990":26554,"53056":26588,"53057":26555,"53058":26616,"53059":26584,"53060":26560,"53061":26551,"53062":26565,"53063":26603,"53064":26596,"53065":26591,"53066":26549,"53067":26573,"53068":26547,"53069":26615,"53070":26614,"53071":26606,"53072":26595,"53073":26562,"53074":26553,"53075":26574,"53076":26599,"53077":26608,"53078":26546,"53079":26620,"53080":26566,"53081":26605,"53082":26572,"53083":26542,"53084":26598,"53085":26587,"53086":26618,"53087":26569,"53088":26570,"53089":26563,"53090":26602,"53091":26571,"53092":27432,"53093":27522,"53094":27524,"53095":27574,"53096":27606,"53097":27608,"53098":27616,"53099":27680,"53100":27681,"53101":27944,"53102":27956,"53103":27949,"53104":27935,"53105":27964,"53106":27967,"53107":27922,"53108":27914,"53109":27866,"53110":27955,"53111":27908,"53112":27929,"53113":27962,"53114":27930,"53115":27921,"53116":27904,"53117":27933,"53118":27970,"53153":27905,"53154":27928,"53155":27959,"53156":27907,"53157":27919,"53158":27968,"53159":27911,"53160":27936,"53161":27948,"53162":27912,"53163":27938,"53164":27913,"53165":27920,"53166":28855,"53167":28831,"53168":28862,"53169":28849,"53170":28848,"53171":28833,"53172":28852,"53173":28853,"53174":28841,"53175":29249,"53176":29257,"53177":29258,"53178":29292,"53179":29296,"53180":29299,"53181":29294,"53182":29386,"53183":29412,"53184":29416,"53185":29419,"53186":29407,"53187":29418,"53188":29414,"53189":29411,"53190":29573,"53191":29644,"53192":29634,"53193":29640,"53194":29637,"53195":29625,"53196":29622,"53197":29621,"53198":29620,"53199":29675,"53200":29631,"53201":29639,"53202":29630,"53203":29635,"53204":29638,"53205":29624,"53206":29643,"53207":29932,"53208":29934,"53209":29998,"53210":30023,"53211":30024,"53212":30119,"53213":30122,"53214":30329,"53215":30404,"53216":30472,"53217":30467,"53218":30468,"53219":30469,"53220":30474,"53221":30455,"53222":30459,"53223":30458,"53224":30695,"53225":30696,"53226":30726,"53227":30737,"53228":30738,"53229":30725,"53230":30736,"53231":30735,"53232":30734,"53233":30729,"53234":30723,"53235":30739,"53236":31050,"53237":31052,"53238":31051,"53239":31045,"53240":31044,"53241":31189,"53242":31181,"53243":31183,"53244":31190,"53245":31182,"53246":31360,"53312":31358,"53313":31441,"53314":31488,"53315":31489,"53316":31866,"53317":31864,"53318":31865,"53319":31871,"53320":31872,"53321":31873,"53322":32003,"53323":32008,"53324":32001,"53325":32600,"53326":32657,"53327":32653,"53328":32702,"53329":32775,"53330":32782,"53331":32783,"53332":32788,"53333":32823,"53334":32984,"53335":32967,"53336":32992,"53337":32977,"53338":32968,"53339":32962,"53340":32976,"53341":32965,"53342":32995,"53343":32985,"53344":32988,"53345":32970,"53346":32981,"53347":32969,"53348":32975,"53349":32983,"53350":32998,"53351":32973,"53352":33279,"53353":33313,"53354":33428,"53355":33497,"53356":33534,"53357":33529,"53358":33543,"53359":33512,"53360":33536,"53361":33493,"53362":33594,"53363":33515,"53364":33494,"53365":33524,"53366":33516,"53367":33505,"53368":33522,"53369":33525,"53370":33548,"53371":33531,"53372":33526,"53373":33520,"53374":33514,"53409":33508,"53410":33504,"53411":33530,"53412":33523,"53413":33517,"53414":34423,"53415":34420,"53416":34428,"53417":34419,"53418":34881,"53419":34894,"53420":34919,"53421":34922,"53422":34921,"53423":35283,"53424":35332,"53425":35335,"53426":36210,"53427":36835,"53428":36833,"53429":36846,"53430":36832,"53431":37105,"53432":37053,"53433":37055,"53434":37077,"53435":37061,"53436":37054,"53437":37063,"53438":37067,"53439":37064,"53440":37332,"53441":37331,"53442":38484,"53443":38479,"53444":38481,"53445":38483,"53446":38474,"53447":38478,"53448":20510,"53449":20485,"53450":20487,"53451":20499,"53452":20514,"53453":20528,"53454":20507,"53455":20469,"53456":20468,"53457":20531,"53458":20535,"53459":20524,"53460":20470,"53461":20471,"53462":20503,"53463":20508,"53464":20512,"53465":20519,"53466":20533,"53467":20527,"53468":20529,"53469":20494,"53470":20826,"53471":20884,"53472":20883,"53473":20938,"53474":20932,"53475":20933,"53476":20936,"53477":20942,"53478":21089,"53479":21082,"53480":21074,"53481":21086,"53482":21087,"53483":21077,"53484":21090,"53485":21197,"53486":21262,"53487":21406,"53488":21798,"53489":21730,"53490":21783,"53491":21778,"53492":21735,"53493":21747,"53494":21732,"53495":21786,"53496":21759,"53497":21764,"53498":21768,"53499":21739,"53500":21777,"53501":21765,"53502":21745,"53568":21770,"53569":21755,"53570":21751,"53571":21752,"53572":21728,"53573":21774,"53574":21763,"53575":21771,"53576":22273,"53577":22274,"53578":22476,"53579":22578,"53580":22485,"53581":22482,"53582":22458,"53583":22470,"53584":22461,"53585":22460,"53586":22456,"53587":22454,"53588":22463,"53589":22471,"53590":22480,"53591":22457,"53592":22465,"53593":22798,"53594":22858,"53595":23065,"53596":23062,"53597":23085,"53598":23086,"53599":23061,"53600":23055,"53601":23063,"53602":23050,"53603":23070,"53604":23091,"53605":23404,"53606":23463,"53607":23469,"53608":23468,"53609":23555,"53610":23638,"53611":23636,"53612":23788,"53613":23807,"53614":23790,"53615":23793,"53616":23799,"53617":23808,"53618":23801,"53619":24105,"53620":24104,"53621":24232,"53622":24238,"53623":24234,"53624":24236,"53625":24371,"53626":24368,"53627":24423,"53628":24669,"53629":24666,"53630":24679,"53665":24641,"53666":24738,"53667":24712,"53668":24704,"53669":24722,"53670":24705,"53671":24733,"53672":24707,"53673":24725,"53674":24731,"53675":24727,"53676":24711,"53677":24732,"53678":24718,"53679":25113,"53680":25158,"53681":25330,"53682":25360,"53683":25430,"53684":25388,"53685":25412,"53686":25413,"53687":25398,"53688":25411,"53689":25572,"53690":25401,"53691":25419,"53692":25418,"53693":25404,"53694":25385,"53695":25409,"53696":25396,"53697":25432,"53698":25428,"53699":25433,"53700":25389,"53701":25415,"53702":25395,"53703":25434,"53704":25425,"53705":25400,"53706":25431,"53707":25408,"53708":25416,"53709":25930,"53710":25926,"53711":26054,"53712":26051,"53713":26052,"53714":26050,"53715":26186,"53716":26207,"53717":26183,"53718":26193,"53719":26386,"53720":26387,"53721":26655,"53722":26650,"53723":26697,"53724":26674,"53725":26675,"53726":26683,"53727":26699,"53728":26703,"53729":26646,"53730":26673,"53731":26652,"53732":26677,"53733":26667,"53734":26669,"53735":26671,"53736":26702,"53737":26692,"53738":26676,"53739":26653,"53740":26642,"53741":26644,"53742":26662,"53743":26664,"53744":26670,"53745":26701,"53746":26682,"53747":26661,"53748":26656,"53749":27436,"53750":27439,"53751":27437,"53752":27441,"53753":27444,"53754":27501,"53755":32898,"53756":27528,"53757":27622,"53758":27620,"53824":27624,"53825":27619,"53826":27618,"53827":27623,"53828":27685,"53829":28026,"53830":28003,"53831":28004,"53832":28022,"53833":27917,"53834":28001,"53835":28050,"53836":27992,"53837":28002,"53838":28013,"53839":28015,"53840":28049,"53841":28045,"53842":28143,"53843":28031,"53844":28038,"53845":27998,"53846":28007,"53847":28000,"53848":28055,"53849":28016,"53850":28028,"53851":27999,"53852":28034,"53853":28056,"53854":27951,"53855":28008,"53856":28043,"53857":28030,"53858":28032,"53859":28036,"53860":27926,"53861":28035,"53862":28027,"53863":28029,"53864":28021,"53865":28048,"53866":28892,"53867":28883,"53868":28881,"53869":28893,"53870":28875,"53871":32569,"53872":28898,"53873":28887,"53874":28882,"53875":28894,"53876":28896,"53877":28884,"53878":28877,"53879":28869,"53880":28870,"53881":28871,"53882":28890,"53883":28878,"53884":28897,"53885":29250,"53886":29304,"53921":29303,"53922":29302,"53923":29440,"53924":29434,"53925":29428,"53926":29438,"53927":29430,"53928":29427,"53929":29435,"53930":29441,"53931":29651,"53932":29657,"53933":29669,"53934":29654,"53935":29628,"53936":29671,"53937":29667,"53938":29673,"53939":29660,"53940":29650,"53941":29659,"53942":29652,"53943":29661,"53944":29658,"53945":29655,"53946":29656,"53947":29672,"53948":29918,"53949":29919,"53950":29940,"53951":29941,"53952":29985,"53953":30043,"53954":30047,"53955":30128,"53956":30145,"53957":30139,"53958":30148,"53959":30144,"53960":30143,"53961":30134,"53962":30138,"53963":30346,"53964":30409,"53965":30493,"53966":30491,"53967":30480,"53968":30483,"53969":30482,"53970":30499,"53971":30481,"53972":30485,"53973":30489,"53974":30490,"53975":30498,"53976":30503,"53977":30755,"53978":30764,"53979":30754,"53980":30773,"53981":30767,"53982":30760,"53983":30766,"53984":30763,"53985":30753,"53986":30761,"53987":30771,"53988":30762,"53989":30769,"53990":31060,"53991":31067,"53992":31055,"53993":31068,"53994":31059,"53995":31058,"53996":31057,"53997":31211,"53998":31212,"53999":31200,"54000":31214,"54001":31213,"54002":31210,"54003":31196,"54004":31198,"54005":31197,"54006":31366,"54007":31369,"54008":31365,"54009":31371,"54010":31372,"54011":31370,"54012":31367,"54013":31448,"54014":31504,"54080":31492,"54081":31507,"54082":31493,"54083":31503,"54084":31496,"54085":31498,"54086":31502,"54087":31497,"54088":31506,"54089":31876,"54090":31889,"54091":31882,"54092":31884,"54093":31880,"54094":31885,"54095":31877,"54096":32030,"54097":32029,"54098":32017,"54099":32014,"54100":32024,"54101":32022,"54102":32019,"54103":32031,"54104":32018,"54105":32015,"54106":32012,"54107":32604,"54108":32609,"54109":32606,"54110":32608,"54111":32605,"54112":32603,"54113":32662,"54114":32658,"54115":32707,"54116":32706,"54117":32704,"54118":32790,"54119":32830,"54120":32825,"54121":33018,"54122":33010,"54123":33017,"54124":33013,"54125":33025,"54126":33019,"54127":33024,"54128":33281,"54129":33327,"54130":33317,"54131":33587,"54132":33581,"54133":33604,"54134":33561,"54135":33617,"54136":33573,"54137":33622,"54138":33599,"54139":33601,"54140":33574,"54141":33564,"54142":33570,"54177":33602,"54178":33614,"54179":33563,"54180":33578,"54181":33544,"54182":33596,"54183":33613,"54184":33558,"54185":33572,"54186":33568,"54187":33591,"54188":33583,"54189":33577,"54190":33607,"54191":33605,"54192":33612,"54193":33619,"54194":33566,"54195":33580,"54196":33611,"54197":33575,"54198":33608,"54199":34387,"54200":34386,"54201":34466,"54202":34472,"54203":34454,"54204":34445,"54205":34449,"54206":34462,"54207":34439,"54208":34455,"54209":34438,"54210":34443,"54211":34458,"54212":34437,"54213":34469,"54214":34457,"54215":34465,"54216":34471,"54217":34453,"54218":34456,"54219":34446,"54220":34461,"54221":34448,"54222":34452,"54223":34883,"54224":34884,"54225":34925,"54226":34933,"54227":34934,"54228":34930,"54229":34944,"54230":34929,"54231":34943,"54232":34927,"54233":34947,"54234":34942,"54235":34932,"54236":34940,"54237":35346,"54238":35911,"54239":35927,"54240":35963,"54241":36004,"54242":36003,"54243":36214,"54244":36216,"54245":36277,"54246":36279,"54247":36278,"54248":36561,"54249":36563,"54250":36862,"54251":36853,"54252":36866,"54253":36863,"54254":36859,"54255":36868,"54256":36860,"54257":36854,"54258":37078,"54259":37088,"54260":37081,"54261":37082,"54262":37091,"54263":37087,"54264":37093,"54265":37080,"54266":37083,"54267":37079,"54268":37084,"54269":37092,"54270":37200,"54336":37198,"54337":37199,"54338":37333,"54339":37346,"54340":37338,"54341":38492,"54342":38495,"54343":38588,"54344":39139,"54345":39647,"54346":39727,"54347":20095,"54348":20592,"54349":20586,"54350":20577,"54351":20574,"54352":20576,"54353":20563,"54354":20555,"54355":20573,"54356":20594,"54357":20552,"54358":20557,"54359":20545,"54360":20571,"54361":20554,"54362":20578,"54363":20501,"54364":20549,"54365":20575,"54366":20585,"54367":20587,"54368":20579,"54369":20580,"54370":20550,"54371":20544,"54372":20590,"54373":20595,"54374":20567,"54375":20561,"54376":20944,"54377":21099,"54378":21101,"54379":21100,"54380":21102,"54381":21206,"54382":21203,"54383":21293,"54384":21404,"54385":21877,"54386":21878,"54387":21820,"54388":21837,"54389":21840,"54390":21812,"54391":21802,"54392":21841,"54393":21858,"54394":21814,"54395":21813,"54396":21808,"54397":21842,"54398":21829,"54433":21772,"54434":21810,"54435":21861,"54436":21838,"54437":21817,"54438":21832,"54439":21805,"54440":21819,"54441":21824,"54442":21835,"54443":22282,"54444":22279,"54445":22523,"54446":22548,"54447":22498,"54448":22518,"54449":22492,"54450":22516,"54451":22528,"54452":22509,"54453":22525,"54454":22536,"54455":22520,"54456":22539,"54457":22515,"54458":22479,"54459":22535,"54460":22510,"54461":22499,"54462":22514,"54463":22501,"54464":22508,"54465":22497,"54466":22542,"54467":22524,"54468":22544,"54469":22503,"54470":22529,"54471":22540,"54472":22513,"54473":22505,"54474":22512,"54475":22541,"54476":22532,"54477":22876,"54478":23136,"54479":23128,"54480":23125,"54481":23143,"54482":23134,"54483":23096,"54484":23093,"54485":23149,"54486":23120,"54487":23135,"54488":23141,"54489":23148,"54490":23123,"54491":23140,"54492":23127,"54493":23107,"54494":23133,"54495":23122,"54496":23108,"54497":23131,"54498":23112,"54499":23182,"54500":23102,"54501":23117,"54502":23097,"54503":23116,"54504":23152,"54505":23145,"54506":23111,"54507":23121,"54508":23126,"54509":23106,"54510":23132,"54511":23410,"54512":23406,"54513":23489,"54514":23488,"54515":23641,"54516":23838,"54517":23819,"54518":23837,"54519":23834,"54520":23840,"54521":23820,"54522":23848,"54523":23821,"54524":23846,"54525":23845,"54526":23823,"54592":23856,"54593":23826,"54594":23843,"54595":23839,"54596":23854,"54597":24126,"54598":24116,"54599":24241,"54600":24244,"54601":24249,"54602":24242,"54603":24243,"54604":24374,"54605":24376,"54606":24475,"54607":24470,"54608":24479,"54609":24714,"54610":24720,"54611":24710,"54612":24766,"54613":24752,"54614":24762,"54615":24787,"54616":24788,"54617":24783,"54618":24804,"54619":24793,"54620":24797,"54621":24776,"54622":24753,"54623":24795,"54624":24759,"54625":24778,"54626":24767,"54627":24771,"54628":24781,"54629":24768,"54630":25394,"54631":25445,"54632":25482,"54633":25474,"54634":25469,"54635":25533,"54636":25502,"54637":25517,"54638":25501,"54639":25495,"54640":25515,"54641":25486,"54642":25455,"54643":25479,"54644":25488,"54645":25454,"54646":25519,"54647":25461,"54648":25500,"54649":25453,"54650":25518,"54651":25468,"54652":25508,"54653":25403,"54654":25503,"54689":25464,"54690":25477,"54691":25473,"54692":25489,"54693":25485,"54694":25456,"54695":25939,"54696":26061,"54697":26213,"54698":26209,"54699":26203,"54700":26201,"54701":26204,"54702":26210,"54703":26392,"54704":26745,"54705":26759,"54706":26768,"54707":26780,"54708":26733,"54709":26734,"54710":26798,"54711":26795,"54712":26966,"54713":26735,"54714":26787,"54715":26796,"54716":26793,"54717":26741,"54718":26740,"54719":26802,"54720":26767,"54721":26743,"54722":26770,"54723":26748,"54724":26731,"54725":26738,"54726":26794,"54727":26752,"54728":26737,"54729":26750,"54730":26779,"54731":26774,"54732":26763,"54733":26784,"54734":26761,"54735":26788,"54736":26744,"54737":26747,"54738":26769,"54739":26764,"54740":26762,"54741":26749,"54742":27446,"54743":27443,"54744":27447,"54745":27448,"54746":27537,"54747":27535,"54748":27533,"54749":27534,"54750":27532,"54751":27690,"54752":28096,"54753":28075,"54754":28084,"54755":28083,"54756":28276,"54757":28076,"54758":28137,"54759":28130,"54760":28087,"54761":28150,"54762":28116,"54763":28160,"54764":28104,"54765":28128,"54766":28127,"54767":28118,"54768":28094,"54769":28133,"54770":28124,"54771":28125,"54772":28123,"54773":28148,"54774":28106,"54775":28093,"54776":28141,"54777":28144,"54778":28090,"54779":28117,"54780":28098,"54781":28111,"54782":28105,"54848":28112,"54849":28146,"54850":28115,"54851":28157,"54852":28119,"54853":28109,"54854":28131,"54855":28091,"54856":28922,"54857":28941,"54858":28919,"54859":28951,"54860":28916,"54861":28940,"54862":28912,"54863":28932,"54864":28915,"54865":28944,"54866":28924,"54867":28927,"54868":28934,"54869":28947,"54870":28928,"54871":28920,"54872":28918,"54873":28939,"54874":28930,"54875":28942,"54876":29310,"54877":29307,"54878":29308,"54879":29311,"54880":29469,"54881":29463,"54882":29447,"54883":29457,"54884":29464,"54885":29450,"54886":29448,"54887":29439,"54888":29455,"54889":29470,"54890":29576,"54891":29686,"54892":29688,"54893":29685,"54894":29700,"54895":29697,"54896":29693,"54897":29703,"54898":29696,"54899":29690,"54900":29692,"54901":29695,"54902":29708,"54903":29707,"54904":29684,"54905":29704,"54906":30052,"54907":30051,"54908":30158,"54909":30162,"54910":30159,"54945":30155,"54946":30156,"54947":30161,"54948":30160,"54949":30351,"54950":30345,"54951":30419,"54952":30521,"54953":30511,"54954":30509,"54955":30513,"54956":30514,"54957":30516,"54958":30515,"54959":30525,"54960":30501,"54961":30523,"54962":30517,"54963":30792,"54964":30802,"54965":30793,"54966":30797,"54967":30794,"54968":30796,"54969":30758,"54970":30789,"54971":30800,"54972":31076,"54973":31079,"54974":31081,"54975":31082,"54976":31075,"54977":31083,"54978":31073,"54979":31163,"54980":31226,"54981":31224,"54982":31222,"54983":31223,"54984":31375,"54985":31380,"54986":31376,"54987":31541,"54988":31559,"54989":31540,"54990":31525,"54991":31536,"54992":31522,"54993":31524,"54994":31539,"54995":31512,"54996":31530,"54997":31517,"54998":31537,"54999":31531,"55000":31533,"55001":31535,"55002":31538,"55003":31544,"55004":31514,"55005":31523,"55006":31892,"55007":31896,"55008":31894,"55009":31907,"55010":32053,"55011":32061,"55012":32056,"55013":32054,"55014":32058,"55015":32069,"55016":32044,"55017":32041,"55018":32065,"55019":32071,"55020":32062,"55021":32063,"55022":32074,"55023":32059,"55024":32040,"55025":32611,"55026":32661,"55027":32668,"55028":32669,"55029":32667,"55030":32714,"55031":32715,"55032":32717,"55033":32720,"55034":32721,"55035":32711,"55036":32719,"55037":32713,"55038":32799,"55104":32798,"55105":32795,"55106":32839,"55107":32835,"55108":32840,"55109":33048,"55110":33061,"55111":33049,"55112":33051,"55113":33069,"55114":33055,"55115":33068,"55116":33054,"55117":33057,"55118":33045,"55119":33063,"55120":33053,"55121":33058,"55122":33297,"55123":33336,"55124":33331,"55125":33338,"55126":33332,"55127":33330,"55128":33396,"55129":33680,"55130":33699,"55131":33704,"55132":33677,"55133":33658,"55134":33651,"55135":33700,"55136":33652,"55137":33679,"55138":33665,"55139":33685,"55140":33689,"55141":33653,"55142":33684,"55143":33705,"55144":33661,"55145":33667,"55146":33676,"55147":33693,"55148":33691,"55149":33706,"55150":33675,"55151":33662,"55152":33701,"55153":33711,"55154":33672,"55155":33687,"55156":33712,"55157":33663,"55158":33702,"55159":33671,"55160":33710,"55161":33654,"55162":33690,"55163":34393,"55164":34390,"55165":34495,"55166":34487,"55201":34498,"55202":34497,"55203":34501,"55204":34490,"55205":34480,"55206":34504,"55207":34489,"55208":34483,"55209":34488,"55210":34508,"55211":34484,"55212":34491,"55213":34492,"55214":34499,"55215":34493,"55216":34494,"55217":34898,"55218":34953,"55219":34965,"55220":34984,"55221":34978,"55222":34986,"55223":34970,"55224":34961,"55225":34977,"55226":34975,"55227":34968,"55228":34983,"55229":34969,"55230":34971,"55231":34967,"55232":34980,"55233":34988,"55234":34956,"55235":34963,"55236":34958,"55237":35202,"55238":35286,"55239":35289,"55240":35285,"55241":35376,"55242":35367,"55243":35372,"55244":35358,"55245":35897,"55246":35899,"55247":35932,"55248":35933,"55249":35965,"55250":36005,"55251":36221,"55252":36219,"55253":36217,"55254":36284,"55255":36290,"55256":36281,"55257":36287,"55258":36289,"55259":36568,"55260":36574,"55261":36573,"55262":36572,"55263":36567,"55264":36576,"55265":36577,"55266":36900,"55267":36875,"55268":36881,"55269":36892,"55270":36876,"55271":36897,"55272":37103,"55273":37098,"55274":37104,"55275":37108,"55276":37106,"55277":37107,"55278":37076,"55279":37099,"55280":37100,"55281":37097,"55282":37206,"55283":37208,"55284":37210,"55285":37203,"55286":37205,"55287":37356,"55288":37364,"55289":37361,"55290":37363,"55291":37368,"55292":37348,"55293":37369,"55294":37354,"55360":37355,"55361":37367,"55362":37352,"55363":37358,"55364":38266,"55365":38278,"55366":38280,"55367":38524,"55368":38509,"55369":38507,"55370":38513,"55371":38511,"55372":38591,"55373":38762,"55374":38916,"55375":39141,"55376":39319,"55377":20635,"55378":20629,"55379":20628,"55380":20638,"55381":20619,"55382":20643,"55383":20611,"55384":20620,"55385":20622,"55386":20637,"55387":20584,"55388":20636,"55389":20626,"55390":20610,"55391":20615,"55392":20831,"55393":20948,"55394":21266,"55395":21265,"55396":21412,"55397":21415,"55398":21905,"55399":21928,"55400":21925,"55401":21933,"55402":21879,"55403":22085,"55404":21922,"55405":21907,"55406":21896,"55407":21903,"55408":21941,"55409":21889,"55410":21923,"55411":21906,"55412":21924,"55413":21885,"55414":21900,"55415":21926,"55416":21887,"55417":21909,"55418":21921,"55419":21902,"55420":22284,"55421":22569,"55422":22583,"55457":22553,"55458":22558,"55459":22567,"55460":22563,"55461":22568,"55462":22517,"55463":22600,"55464":22565,"55465":22556,"55466":22555,"55467":22579,"55468":22591,"55469":22582,"55470":22574,"55471":22585,"55472":22584,"55473":22573,"55474":22572,"55475":22587,"55476":22881,"55477":23215,"55478":23188,"55479":23199,"55480":23162,"55481":23202,"55482":23198,"55483":23160,"55484":23206,"55485":23164,"55486":23205,"55487":23212,"55488":23189,"55489":23214,"55490":23095,"55491":23172,"55492":23178,"55493":23191,"55494":23171,"55495":23179,"55496":23209,"55497":23163,"55498":23165,"55499":23180,"55500":23196,"55501":23183,"55502":23187,"55503":23197,"55504":23530,"55505":23501,"55506":23499,"55507":23508,"55508":23505,"55509":23498,"55510":23502,"55511":23564,"55512":23600,"55513":23863,"55514":23875,"55515":23915,"55516":23873,"55517":23883,"55518":23871,"55519":23861,"55520":23889,"55521":23886,"55522":23893,"55523":23859,"55524":23866,"55525":23890,"55526":23869,"55527":23857,"55528":23897,"55529":23874,"55530":23865,"55531":23881,"55532":23864,"55533":23868,"55534":23858,"55535":23862,"55536":23872,"55537":23877,"55538":24132,"55539":24129,"55540":24408,"55541":24486,"55542":24485,"55543":24491,"55544":24777,"55545":24761,"55546":24780,"55547":24802,"55548":24782,"55549":24772,"55550":24852,"55616":24818,"55617":24842,"55618":24854,"55619":24837,"55620":24821,"55621":24851,"55622":24824,"55623":24828,"55624":24830,"55625":24769,"55626":24835,"55627":24856,"55628":24861,"55629":24848,"55630":24831,"55631":24836,"55632":24843,"55633":25162,"55634":25492,"55635":25521,"55636":25520,"55637":25550,"55638":25573,"55639":25576,"55640":25583,"55641":25539,"55642":25757,"55643":25587,"55644":25546,"55645":25568,"55646":25590,"55647":25557,"55648":25586,"55649":25589,"55650":25697,"55651":25567,"55652":25534,"55653":25565,"55654":25564,"55655":25540,"55656":25560,"55657":25555,"55658":25538,"55659":25543,"55660":25548,"55661":25547,"55662":25544,"55663":25584,"55664":25559,"55665":25561,"55666":25906,"55667":25959,"55668":25962,"55669":25956,"55670":25948,"55671":25960,"55672":25957,"55673":25996,"55674":26013,"55675":26014,"55676":26030,"55677":26064,"55678":26066,"55713":26236,"55714":26220,"55715":26235,"55716":26240,"55717":26225,"55718":26233,"55719":26218,"55720":26226,"55721":26369,"55722":26892,"55723":26835,"55724":26884,"55725":26844,"55726":26922,"55727":26860,"55728":26858,"55729":26865,"55730":26895,"55731":26838,"55732":26871,"55733":26859,"55734":26852,"55735":26870,"55736":26899,"55737":26896,"55738":26867,"55739":26849,"55740":26887,"55741":26828,"55742":26888,"55743":26992,"55744":26804,"55745":26897,"55746":26863,"55747":26822,"55748":26900,"55749":26872,"55750":26832,"55751":26877,"55752":26876,"55753":26856,"55754":26891,"55755":26890,"55756":26903,"55757":26830,"55758":26824,"55759":26845,"55760":26846,"55761":26854,"55762":26868,"55763":26833,"55764":26886,"55765":26836,"55766":26857,"55767":26901,"55768":26917,"55769":26823,"55770":27449,"55771":27451,"55772":27455,"55773":27452,"55774":27540,"55775":27543,"55776":27545,"55777":27541,"55778":27581,"55779":27632,"55780":27634,"55781":27635,"55782":27696,"55783":28156,"55784":28230,"55785":28231,"55786":28191,"55787":28233,"55788":28296,"55789":28220,"55790":28221,"55791":28229,"55792":28258,"55793":28203,"55794":28223,"55795":28225,"55796":28253,"55797":28275,"55798":28188,"55799":28211,"55800":28235,"55801":28224,"55802":28241,"55803":28219,"55804":28163,"55805":28206,"55806":28254,"55872":28264,"55873":28252,"55874":28257,"55875":28209,"55876":28200,"55877":28256,"55878":28273,"55879":28267,"55880":28217,"55881":28194,"55882":28208,"55883":28243,"55884":28261,"55885":28199,"55886":28280,"55887":28260,"55888":28279,"55889":28245,"55890":28281,"55891":28242,"55892":28262,"55893":28213,"55894":28214,"55895":28250,"55896":28960,"55897":28958,"55898":28975,"55899":28923,"55900":28974,"55901":28977,"55902":28963,"55903":28965,"55904":28962,"55905":28978,"55906":28959,"55907":28968,"55908":28986,"55909":28955,"55910":29259,"55911":29274,"55912":29320,"55913":29321,"55914":29318,"55915":29317,"55916":29323,"55917":29458,"55918":29451,"55919":29488,"55920":29474,"55921":29489,"55922":29491,"55923":29479,"55924":29490,"55925":29485,"55926":29478,"55927":29475,"55928":29493,"55929":29452,"55930":29742,"55931":29740,"55932":29744,"55933":29739,"55934":29718,"55969":29722,"55970":29729,"55971":29741,"55972":29745,"55973":29732,"55974":29731,"55975":29725,"55976":29737,"55977":29728,"55978":29746,"55979":29947,"55980":29999,"55981":30063,"55982":30060,"55983":30183,"55984":30170,"55985":30177,"55986":30182,"55987":30173,"55988":30175,"55989":30180,"55990":30167,"55991":30357,"55992":30354,"55993":30426,"55994":30534,"55995":30535,"55996":30532,"55997":30541,"55998":30533,"55999":30538,"56000":30542,"56001":30539,"56002":30540,"56003":30686,"56004":30700,"56005":30816,"56006":30820,"56007":30821,"56008":30812,"56009":30829,"56010":30833,"56011":30826,"56012":30830,"56013":30832,"56014":30825,"56015":30824,"56016":30814,"56017":30818,"56018":31092,"56019":31091,"56020":31090,"56021":31088,"56022":31234,"56023":31242,"56024":31235,"56025":31244,"56026":31236,"56027":31385,"56028":31462,"56029":31460,"56030":31562,"56031":31547,"56032":31556,"56033":31560,"56034":31564,"56035":31566,"56036":31552,"56037":31576,"56038":31557,"56039":31906,"56040":31902,"56041":31912,"56042":31905,"56043":32088,"56044":32111,"56045":32099,"56046":32083,"56047":32086,"56048":32103,"56049":32106,"56050":32079,"56051":32109,"56052":32092,"56053":32107,"56054":32082,"56055":32084,"56056":32105,"56057":32081,"56058":32095,"56059":32078,"56060":32574,"56061":32575,"56062":32613,"56128":32614,"56129":32674,"56130":32672,"56131":32673,"56132":32727,"56133":32849,"56134":32847,"56135":32848,"56136":33022,"56137":32980,"56138":33091,"56139":33098,"56140":33106,"56141":33103,"56142":33095,"56143":33085,"56144":33101,"56145":33082,"56146":33254,"56147":33262,"56148":33271,"56149":33272,"56150":33273,"56151":33284,"56152":33340,"56153":33341,"56154":33343,"56155":33397,"56156":33595,"56157":33743,"56158":33785,"56159":33827,"56160":33728,"56161":33768,"56162":33810,"56163":33767,"56164":33764,"56165":33788,"56166":33782,"56167":33808,"56168":33734,"56169":33736,"56170":33771,"56171":33763,"56172":33727,"56173":33793,"56174":33757,"56175":33765,"56176":33752,"56177":33791,"56178":33761,"56179":33739,"56180":33742,"56181":33750,"56182":33781,"56183":33737,"56184":33801,"56185":33807,"56186":33758,"56187":33809,"56188":33798,"56189":33730,"56190":33779,"56225":33749,"56226":33786,"56227":33735,"56228":33745,"56229":33770,"56230":33811,"56231":33731,"56232":33772,"56233":33774,"56234":33732,"56235":33787,"56236":33751,"56237":33762,"56238":33819,"56239":33755,"56240":33790,"56241":34520,"56242":34530,"56243":34534,"56244":34515,"56245":34531,"56246":34522,"56247":34538,"56248":34525,"56249":34539,"56250":34524,"56251":34540,"56252":34537,"56253":34519,"56254":34536,"56255":34513,"56256":34888,"56257":34902,"56258":34901,"56259":35002,"56260":35031,"56261":35001,"56262":35000,"56263":35008,"56264":35006,"56265":34998,"56266":35004,"56267":34999,"56268":35005,"56269":34994,"56270":35073,"56271":35017,"56272":35221,"56273":35224,"56274":35223,"56275":35293,"56276":35290,"56277":35291,"56278":35406,"56279":35405,"56280":35385,"56281":35417,"56282":35392,"56283":35415,"56284":35416,"56285":35396,"56286":35397,"56287":35410,"56288":35400,"56289":35409,"56290":35402,"56291":35404,"56292":35407,"56293":35935,"56294":35969,"56295":35968,"56296":36026,"56297":36030,"56298":36016,"56299":36025,"56300":36021,"56301":36228,"56302":36224,"56303":36233,"56304":36312,"56305":36307,"56306":36301,"56307":36295,"56308":36310,"56309":36316,"56310":36303,"56311":36309,"56312":36313,"56313":36296,"56314":36311,"56315":36293,"56316":36591,"56317":36599,"56318":36602,"56384":36601,"56385":36582,"56386":36590,"56387":36581,"56388":36597,"56389":36583,"56390":36584,"56391":36598,"56392":36587,"56393":36593,"56394":36588,"56395":36596,"56396":36585,"56397":36909,"56398":36916,"56399":36911,"56400":37126,"56401":37164,"56402":37124,"56403":37119,"56404":37116,"56405":37128,"56406":37113,"56407":37115,"56408":37121,"56409":37120,"56410":37127,"56411":37125,"56412":37123,"56413":37217,"56414":37220,"56415":37215,"56416":37218,"56417":37216,"56418":37377,"56419":37386,"56420":37413,"56421":37379,"56422":37402,"56423":37414,"56424":37391,"56425":37388,"56426":37376,"56427":37394,"56428":37375,"56429":37373,"56430":37382,"56431":37380,"56432":37415,"56433":37378,"56434":37404,"56435":37412,"56436":37401,"56437":37399,"56438":37381,"56439":37398,"56440":38267,"56441":38285,"56442":38284,"56443":38288,"56444":38535,"56445":38526,"56446":38536,"56481":38537,"56482":38531,"56483":38528,"56484":38594,"56485":38600,"56486":38595,"56487":38641,"56488":38640,"56489":38764,"56490":38768,"56491":38766,"56492":38919,"56493":39081,"56494":39147,"56495":40166,"56496":40697,"56497":20099,"56498":20100,"56499":20150,"56500":20669,"56501":20671,"56502":20678,"56503":20654,"56504":20676,"56505":20682,"56506":20660,"56507":20680,"56508":20674,"56509":20656,"56510":20673,"56511":20666,"56512":20657,"56513":20683,"56514":20681,"56515":20662,"56516":20664,"56517":20951,"56518":21114,"56519":21112,"56520":21115,"56521":21116,"56522":21955,"56523":21979,"56524":21964,"56525":21968,"56526":21963,"56527":21962,"56528":21981,"56529":21952,"56530":21972,"56531":21956,"56532":21993,"56533":21951,"56534":21970,"56535":21901,"56536":21967,"56537":21973,"56538":21986,"56539":21974,"56540":21960,"56541":22002,"56542":21965,"56543":21977,"56544":21954,"56545":22292,"56546":22611,"56547":22632,"56548":22628,"56549":22607,"56550":22605,"56551":22601,"56552":22639,"56553":22613,"56554":22606,"56555":22621,"56556":22617,"56557":22629,"56558":22619,"56559":22589,"56560":22627,"56561":22641,"56562":22780,"56563":23239,"56564":23236,"56565":23243,"56566":23226,"56567":23224,"56568":23217,"56569":23221,"56570":23216,"56571":23231,"56572":23240,"56573":23227,"56574":23238,"56640":23223,"56641":23232,"56642":23242,"56643":23220,"56644":23222,"56645":23245,"56646":23225,"56647":23184,"56648":23510,"56649":23512,"56650":23513,"56651":23583,"56652":23603,"56653":23921,"56654":23907,"56655":23882,"56656":23909,"56657":23922,"56658":23916,"56659":23902,"56660":23912,"56661":23911,"56662":23906,"56663":24048,"56664":24143,"56665":24142,"56666":24138,"56667":24141,"56668":24139,"56669":24261,"56670":24268,"56671":24262,"56672":24267,"56673":24263,"56674":24384,"56675":24495,"56676":24493,"56677":24823,"56678":24905,"56679":24906,"56680":24875,"56681":24901,"56682":24886,"56683":24882,"56684":24878,"56685":24902,"56686":24879,"56687":24911,"56688":24873,"56689":24896,"56690":25120,"56691":37224,"56692":25123,"56693":25125,"56694":25124,"56695":25541,"56696":25585,"56697":25579,"56698":25616,"56699":25618,"56700":25609,"56701":25632,"56702":25636,"56737":25651,"56738":25667,"56739":25631,"56740":25621,"56741":25624,"56742":25657,"56743":25655,"56744":25634,"56745":25635,"56746":25612,"56747":25638,"56748":25648,"56749":25640,"56750":25665,"56751":25653,"56752":25647,"56753":25610,"56754":25626,"56755":25664,"56756":25637,"56757":25639,"56758":25611,"56759":25575,"56760":25627,"56761":25646,"56762":25633,"56763":25614,"56764":25967,"56765":26002,"56766":26067,"56767":26246,"56768":26252,"56769":26261,"56770":26256,"56771":26251,"56772":26250,"56773":26265,"56774":26260,"56775":26232,"56776":26400,"56777":26982,"56778":26975,"56779":26936,"56780":26958,"56781":26978,"56782":26993,"56783":26943,"56784":26949,"56785":26986,"56786":26937,"56787":26946,"56788":26967,"56789":26969,"56790":27002,"56791":26952,"56792":26953,"56793":26933,"56794":26988,"56795":26931,"56796":26941,"56797":26981,"56798":26864,"56799":27000,"56800":26932,"56801":26985,"56802":26944,"56803":26991,"56804":26948,"56805":26998,"56806":26968,"56807":26945,"56808":26996,"56809":26956,"56810":26939,"56811":26955,"56812":26935,"56813":26972,"56814":26959,"56815":26961,"56816":26930,"56817":26962,"56818":26927,"56819":27003,"56820":26940,"56821":27462,"56822":27461,"56823":27459,"56824":27458,"56825":27464,"56826":27457,"56827":27547,"56828":64013,"56829":27643,"56830":27644,"56896":27641,"56897":27639,"56898":27640,"56899":28315,"56900":28374,"56901":28360,"56902":28303,"56903":28352,"56904":28319,"56905":28307,"56906":28308,"56907":28320,"56908":28337,"56909":28345,"56910":28358,"56911":28370,"56912":28349,"56913":28353,"56914":28318,"56915":28361,"56916":28343,"56917":28336,"56918":28365,"56919":28326,"56920":28367,"56921":28338,"56922":28350,"56923":28355,"56924":28380,"56925":28376,"56926":28313,"56927":28306,"56928":28302,"56929":28301,"56930":28324,"56931":28321,"56932":28351,"56933":28339,"56934":28368,"56935":28362,"56936":28311,"56937":28334,"56938":28323,"56939":28999,"56940":29012,"56941":29010,"56942":29027,"56943":29024,"56944":28993,"56945":29021,"56946":29026,"56947":29042,"56948":29048,"56949":29034,"56950":29025,"56951":28994,"56952":29016,"56953":28995,"56954":29003,"56955":29040,"56956":29023,"56957":29008,"56958":29011,"56993":28996,"56994":29005,"56995":29018,"56996":29263,"56997":29325,"56998":29324,"56999":29329,"57000":29328,"57001":29326,"57002":29500,"57003":29506,"57004":29499,"57005":29498,"57006":29504,"57007":29514,"57008":29513,"57009":29764,"57010":29770,"57011":29771,"57012":29778,"57013":29777,"57014":29783,"57015":29760,"57016":29775,"57017":29776,"57018":29774,"57019":29762,"57020":29766,"57021":29773,"57022":29780,"57023":29921,"57024":29951,"57025":29950,"57026":29949,"57027":29981,"57028":30073,"57029":30071,"57030":27011,"57031":30191,"57032":30223,"57033":30211,"57034":30199,"57035":30206,"57036":30204,"57037":30201,"57038":30200,"57039":30224,"57040":30203,"57041":30198,"57042":30189,"57043":30197,"57044":30205,"57045":30361,"57046":30389,"57047":30429,"57048":30549,"57049":30559,"57050":30560,"57051":30546,"57052":30550,"57053":30554,"57054":30569,"57055":30567,"57056":30548,"57057":30553,"57058":30573,"57059":30688,"57060":30855,"57061":30874,"57062":30868,"57063":30863,"57064":30852,"57065":30869,"57066":30853,"57067":30854,"57068":30881,"57069":30851,"57070":30841,"57071":30873,"57072":30848,"57073":30870,"57074":30843,"57075":31100,"57076":31106,"57077":31101,"57078":31097,"57079":31249,"57080":31256,"57081":31257,"57082":31250,"57083":31255,"57084":31253,"57085":31266,"57086":31251,"57152":31259,"57153":31248,"57154":31395,"57155":31394,"57156":31390,"57157":31467,"57158":31590,"57159":31588,"57160":31597,"57161":31604,"57162":31593,"57163":31602,"57164":31589,"57165":31603,"57166":31601,"57167":31600,"57168":31585,"57169":31608,"57170":31606,"57171":31587,"57172":31922,"57173":31924,"57174":31919,"57175":32136,"57176":32134,"57177":32128,"57178":32141,"57179":32127,"57180":32133,"57181":32122,"57182":32142,"57183":32123,"57184":32131,"57185":32124,"57186":32140,"57187":32148,"57188":32132,"57189":32125,"57190":32146,"57191":32621,"57192":32619,"57193":32615,"57194":32616,"57195":32620,"57196":32678,"57197":32677,"57198":32679,"57199":32731,"57200":32732,"57201":32801,"57202":33124,"57203":33120,"57204":33143,"57205":33116,"57206":33129,"57207":33115,"57208":33122,"57209":33138,"57210":26401,"57211":33118,"57212":33142,"57213":33127,"57214":33135,"57249":33092,"57250":33121,"57251":33309,"57252":33353,"57253":33348,"57254":33344,"57255":33346,"57256":33349,"57257":34033,"57258":33855,"57259":33878,"57260":33910,"57261":33913,"57262":33935,"57263":33933,"57264":33893,"57265":33873,"57266":33856,"57267":33926,"57268":33895,"57269":33840,"57270":33869,"57271":33917,"57272":33882,"57273":33881,"57274":33908,"57275":33907,"57276":33885,"57277":34055,"57278":33886,"57279":33847,"57280":33850,"57281":33844,"57282":33914,"57283":33859,"57284":33912,"57285":33842,"57286":33861,"57287":33833,"57288":33753,"57289":33867,"57290":33839,"57291":33858,"57292":33837,"57293":33887,"57294":33904,"57295":33849,"57296":33870,"57297":33868,"57298":33874,"57299":33903,"57300":33989,"57301":33934,"57302":33851,"57303":33863,"57304":33846,"57305":33843,"57306":33896,"57307":33918,"57308":33860,"57309":33835,"57310":33888,"57311":33876,"57312":33902,"57313":33872,"57314":34571,"57315":34564,"57316":34551,"57317":34572,"57318":34554,"57319":34518,"57320":34549,"57321":34637,"57322":34552,"57323":34574,"57324":34569,"57325":34561,"57326":34550,"57327":34573,"57328":34565,"57329":35030,"57330":35019,"57331":35021,"57332":35022,"57333":35038,"57334":35035,"57335":35034,"57336":35020,"57337":35024,"57338":35205,"57339":35227,"57340":35295,"57341":35301,"57342":35300,"57408":35297,"57409":35296,"57410":35298,"57411":35292,"57412":35302,"57413":35446,"57414":35462,"57415":35455,"57416":35425,"57417":35391,"57418":35447,"57419":35458,"57420":35460,"57421":35445,"57422":35459,"57423":35457,"57424":35444,"57425":35450,"57426":35900,"57427":35915,"57428":35914,"57429":35941,"57430":35940,"57431":35942,"57432":35974,"57433":35972,"57434":35973,"57435":36044,"57436":36200,"57437":36201,"57438":36241,"57439":36236,"57440":36238,"57441":36239,"57442":36237,"57443":36243,"57444":36244,"57445":36240,"57446":36242,"57447":36336,"57448":36320,"57449":36332,"57450":36337,"57451":36334,"57452":36304,"57453":36329,"57454":36323,"57455":36322,"57456":36327,"57457":36338,"57458":36331,"57459":36340,"57460":36614,"57461":36607,"57462":36609,"57463":36608,"57464":36613,"57465":36615,"57466":36616,"57467":36610,"57468":36619,"57469":36946,"57470":36927,"57505":36932,"57506":36937,"57507":36925,"57508":37136,"57509":37133,"57510":37135,"57511":37137,"57512":37142,"57513":37140,"57514":37131,"57515":37134,"57516":37230,"57517":37231,"57518":37448,"57519":37458,"57520":37424,"57521":37434,"57522":37478,"57523":37427,"57524":37477,"57525":37470,"57526":37507,"57527":37422,"57528":37450,"57529":37446,"57530":37485,"57531":37484,"57532":37455,"57533":37472,"57534":37479,"57535":37487,"57536":37430,"57537":37473,"57538":37488,"57539":37425,"57540":37460,"57541":37475,"57542":37456,"57543":37490,"57544":37454,"57545":37459,"57546":37452,"57547":37462,"57548":37426,"57549":38303,"57550":38300,"57551":38302,"57552":38299,"57553":38546,"57554":38547,"57555":38545,"57556":38551,"57557":38606,"57558":38650,"57559":38653,"57560":38648,"57561":38645,"57562":38771,"57563":38775,"57564":38776,"57565":38770,"57566":38927,"57567":38925,"57568":38926,"57569":39084,"57570":39158,"57571":39161,"57572":39343,"57573":39346,"57574":39344,"57575":39349,"57576":39597,"57577":39595,"57578":39771,"57579":40170,"57580":40173,"57581":40167,"57582":40576,"57583":40701,"57584":20710,"57585":20692,"57586":20695,"57587":20712,"57588":20723,"57589":20699,"57590":20714,"57591":20701,"57592":20708,"57593":20691,"57594":20716,"57595":20720,"57596":20719,"57597":20707,"57598":20704,"57664":20952,"57665":21120,"57666":21121,"57667":21225,"57668":21227,"57669":21296,"57670":21420,"57671":22055,"57672":22037,"57673":22028,"57674":22034,"57675":22012,"57676":22031,"57677":22044,"57678":22017,"57679":22035,"57680":22018,"57681":22010,"57682":22045,"57683":22020,"57684":22015,"57685":22009,"57686":22665,"57687":22652,"57688":22672,"57689":22680,"57690":22662,"57691":22657,"57692":22655,"57693":22644,"57694":22667,"57695":22650,"57696":22663,"57697":22673,"57698":22670,"57699":22646,"57700":22658,"57701":22664,"57702":22651,"57703":22676,"57704":22671,"57705":22782,"57706":22891,"57707":23260,"57708":23278,"57709":23269,"57710":23253,"57711":23274,"57712":23258,"57713":23277,"57714":23275,"57715":23283,"57716":23266,"57717":23264,"57718":23259,"57719":23276,"57720":23262,"57721":23261,"57722":23257,"57723":23272,"57724":23263,"57725":23415,"57726":23520,"57761":23523,"57762":23651,"57763":23938,"57764":23936,"57765":23933,"57766":23942,"57767":23930,"57768":23937,"57769":23927,"57770":23946,"57771":23945,"57772":23944,"57773":23934,"57774":23932,"57775":23949,"57776":23929,"57777":23935,"57778":24152,"57779":24153,"57780":24147,"57781":24280,"57782":24273,"57783":24279,"57784":24270,"57785":24284,"57786":24277,"57787":24281,"57788":24274,"57789":24276,"57790":24388,"57791":24387,"57792":24431,"57793":24502,"57794":24876,"57795":24872,"57796":24897,"57797":24926,"57798":24945,"57799":24947,"57800":24914,"57801":24915,"57802":24946,"57803":24940,"57804":24960,"57805":24948,"57806":24916,"57807":24954,"57808":24923,"57809":24933,"57810":24891,"57811":24938,"57812":24929,"57813":24918,"57814":25129,"57815":25127,"57816":25131,"57817":25643,"57818":25677,"57819":25691,"57820":25693,"57821":25716,"57822":25718,"57823":25714,"57824":25715,"57825":25725,"57826":25717,"57827":25702,"57828":25766,"57829":25678,"57830":25730,"57831":25694,"57832":25692,"57833":25675,"57834":25683,"57835":25696,"57836":25680,"57837":25727,"57838":25663,"57839":25708,"57840":25707,"57841":25689,"57842":25701,"57843":25719,"57844":25971,"57845":26016,"57846":26273,"57847":26272,"57848":26271,"57849":26373,"57850":26372,"57851":26402,"57852":27057,"57853":27062,"57854":27081,"57920":27040,"57921":27086,"57922":27030,"57923":27056,"57924":27052,"57925":27068,"57926":27025,"57927":27033,"57928":27022,"57929":27047,"57930":27021,"57931":27049,"57932":27070,"57933":27055,"57934":27071,"57935":27076,"57936":27069,"57937":27044,"57938":27092,"57939":27065,"57940":27082,"57941":27034,"57942":27087,"57943":27059,"57944":27027,"57945":27050,"57946":27041,"57947":27038,"57948":27097,"57949":27031,"57950":27024,"57951":27074,"57952":27061,"57953":27045,"57954":27078,"57955":27466,"57956":27469,"57957":27467,"57958":27550,"57959":27551,"57960":27552,"57961":27587,"57962":27588,"57963":27646,"57964":28366,"57965":28405,"57966":28401,"57967":28419,"57968":28453,"57969":28408,"57970":28471,"57971":28411,"57972":28462,"57973":28425,"57974":28494,"57975":28441,"57976":28442,"57977":28455,"57978":28440,"57979":28475,"57980":28434,"57981":28397,"57982":28426,"58017":28470,"58018":28531,"58019":28409,"58020":28398,"58021":28461,"58022":28480,"58023":28464,"58024":28476,"58025":28469,"58026":28395,"58027":28423,"58028":28430,"58029":28483,"58030":28421,"58031":28413,"58032":28406,"58033":28473,"58034":28444,"58035":28412,"58036":28474,"58037":28447,"58038":28429,"58039":28446,"58040":28424,"58041":28449,"58042":29063,"58043":29072,"58044":29065,"58045":29056,"58046":29061,"58047":29058,"58048":29071,"58049":29051,"58050":29062,"58051":29057,"58052":29079,"58053":29252,"58054":29267,"58055":29335,"58056":29333,"58057":29331,"58058":29507,"58059":29517,"58060":29521,"58061":29516,"58062":29794,"58063":29811,"58064":29809,"58065":29813,"58066":29810,"58067":29799,"58068":29806,"58069":29952,"58070":29954,"58071":29955,"58072":30077,"58073":30096,"58074":30230,"58075":30216,"58076":30220,"58077":30229,"58078":30225,"58079":30218,"58080":30228,"58081":30392,"58082":30593,"58083":30588,"58084":30597,"58085":30594,"58086":30574,"58087":30592,"58088":30575,"58089":30590,"58090":30595,"58091":30898,"58092":30890,"58093":30900,"58094":30893,"58095":30888,"58096":30846,"58097":30891,"58098":30878,"58099":30885,"58100":30880,"58101":30892,"58102":30882,"58103":30884,"58104":31128,"58105":31114,"58106":31115,"58107":31126,"58108":31125,"58109":31124,"58110":31123,"58176":31127,"58177":31112,"58178":31122,"58179":31120,"58180":31275,"58181":31306,"58182":31280,"58183":31279,"58184":31272,"58185":31270,"58186":31400,"58187":31403,"58188":31404,"58189":31470,"58190":31624,"58191":31644,"58192":31626,"58193":31633,"58194":31632,"58195":31638,"58196":31629,"58197":31628,"58198":31643,"58199":31630,"58200":31621,"58201":31640,"58202":21124,"58203":31641,"58204":31652,"58205":31618,"58206":31931,"58207":31935,"58208":31932,"58209":31930,"58210":32167,"58211":32183,"58212":32194,"58213":32163,"58214":32170,"58215":32193,"58216":32192,"58217":32197,"58218":32157,"58219":32206,"58220":32196,"58221":32198,"58222":32203,"58223":32204,"58224":32175,"58225":32185,"58226":32150,"58227":32188,"58228":32159,"58229":32166,"58230":32174,"58231":32169,"58232":32161,"58233":32201,"58234":32627,"58235":32738,"58236":32739,"58237":32741,"58238":32734,"58273":32804,"58274":32861,"58275":32860,"58276":33161,"58277":33158,"58278":33155,"58279":33159,"58280":33165,"58281":33164,"58282":33163,"58283":33301,"58284":33943,"58285":33956,"58286":33953,"58287":33951,"58288":33978,"58289":33998,"58290":33986,"58291":33964,"58292":33966,"58293":33963,"58294":33977,"58295":33972,"58296":33985,"58297":33997,"58298":33962,"58299":33946,"58300":33969,"58301":34000,"58302":33949,"58303":33959,"58304":33979,"58305":33954,"58306":33940,"58307":33991,"58308":33996,"58309":33947,"58310":33961,"58311":33967,"58312":33960,"58313":34006,"58314":33944,"58315":33974,"58316":33999,"58317":33952,"58318":34007,"58319":34004,"58320":34002,"58321":34011,"58322":33968,"58323":33937,"58324":34401,"58325":34611,"58326":34595,"58327":34600,"58328":34667,"58329":34624,"58330":34606,"58331":34590,"58332":34593,"58333":34585,"58334":34587,"58335":34627,"58336":34604,"58337":34625,"58338":34622,"58339":34630,"58340":34592,"58341":34610,"58342":34602,"58343":34605,"58344":34620,"58345":34578,"58346":34618,"58347":34609,"58348":34613,"58349":34626,"58350":34598,"58351":34599,"58352":34616,"58353":34596,"58354":34586,"58355":34608,"58356":34577,"58357":35063,"58358":35047,"58359":35057,"58360":35058,"58361":35066,"58362":35070,"58363":35054,"58364":35068,"58365":35062,"58366":35067,"58432":35056,"58433":35052,"58434":35051,"58435":35229,"58436":35233,"58437":35231,"58438":35230,"58439":35305,"58440":35307,"58441":35304,"58442":35499,"58443":35481,"58444":35467,"58445":35474,"58446":35471,"58447":35478,"58448":35901,"58449":35944,"58450":35945,"58451":36053,"58452":36047,"58453":36055,"58454":36246,"58455":36361,"58456":36354,"58457":36351,"58458":36365,"58459":36349,"58460":36362,"58461":36355,"58462":36359,"58463":36358,"58464":36357,"58465":36350,"58466":36352,"58467":36356,"58468":36624,"58469":36625,"58470":36622,"58471":36621,"58472":37155,"58473":37148,"58474":37152,"58475":37154,"58476":37151,"58477":37149,"58478":37146,"58479":37156,"58480":37153,"58481":37147,"58482":37242,"58483":37234,"58484":37241,"58485":37235,"58486":37541,"58487":37540,"58488":37494,"58489":37531,"58490":37498,"58491":37536,"58492":37524,"58493":37546,"58494":37517,"58529":37542,"58530":37530,"58531":37547,"58532":37497,"58533":37527,"58534":37503,"58535":37539,"58536":37614,"58537":37518,"58538":37506,"58539":37525,"58540":37538,"58541":37501,"58542":37512,"58543":37537,"58544":37514,"58545":37510,"58546":37516,"58547":37529,"58548":37543,"58549":37502,"58550":37511,"58551":37545,"58552":37533,"58553":37515,"58554":37421,"58555":38558,"58556":38561,"58557":38655,"58558":38744,"58559":38781,"58560":38778,"58561":38782,"58562":38787,"58563":38784,"58564":38786,"58565":38779,"58566":38788,"58567":38785,"58568":38783,"58569":38862,"58570":38861,"58571":38934,"58572":39085,"58573":39086,"58574":39170,"58575":39168,"58576":39175,"58577":39325,"58578":39324,"58579":39363,"58580":39353,"58581":39355,"58582":39354,"58583":39362,"58584":39357,"58585":39367,"58586":39601,"58587":39651,"58588":39655,"58589":39742,"58590":39743,"58591":39776,"58592":39777,"58593":39775,"58594":40177,"58595":40178,"58596":40181,"58597":40615,"58598":20735,"58599":20739,"58600":20784,"58601":20728,"58602":20742,"58603":20743,"58604":20726,"58605":20734,"58606":20747,"58607":20748,"58608":20733,"58609":20746,"58610":21131,"58611":21132,"58612":21233,"58613":21231,"58614":22088,"58615":22082,"58616":22092,"58617":22069,"58618":22081,"58619":22090,"58620":22089,"58621":22086,"58622":22104,"58688":22106,"58689":22080,"58690":22067,"58691":22077,"58692":22060,"58693":22078,"58694":22072,"58695":22058,"58696":22074,"58697":22298,"58698":22699,"58699":22685,"58700":22705,"58701":22688,"58702":22691,"58703":22703,"58704":22700,"58705":22693,"58706":22689,"58707":22783,"58708":23295,"58709":23284,"58710":23293,"58711":23287,"58712":23286,"58713":23299,"58714":23288,"58715":23298,"58716":23289,"58717":23297,"58718":23303,"58719":23301,"58720":23311,"58721":23655,"58722":23961,"58723":23959,"58724":23967,"58725":23954,"58726":23970,"58727":23955,"58728":23957,"58729":23968,"58730":23964,"58731":23969,"58732":23962,"58733":23966,"58734":24169,"58735":24157,"58736":24160,"58737":24156,"58738":32243,"58739":24283,"58740":24286,"58741":24289,"58742":24393,"58743":24498,"58744":24971,"58745":24963,"58746":24953,"58747":25009,"58748":25008,"58749":24994,"58750":24969,"58785":24987,"58786":24979,"58787":25007,"58788":25005,"58789":24991,"58790":24978,"58791":25002,"58792":24993,"58793":24973,"58794":24934,"58795":25011,"58796":25133,"58797":25710,"58798":25712,"58799":25750,"58800":25760,"58801":25733,"58802":25751,"58803":25756,"58804":25743,"58805":25739,"58806":25738,"58807":25740,"58808":25763,"58809":25759,"58810":25704,"58811":25777,"58812":25752,"58813":25974,"58814":25978,"58815":25977,"58816":25979,"58817":26034,"58818":26035,"58819":26293,"58820":26288,"58821":26281,"58822":26290,"58823":26295,"58824":26282,"58825":26287,"58826":27136,"58827":27142,"58828":27159,"58829":27109,"58830":27128,"58831":27157,"58832":27121,"58833":27108,"58834":27168,"58835":27135,"58836":27116,"58837":27106,"58838":27163,"58839":27165,"58840":27134,"58841":27175,"58842":27122,"58843":27118,"58844":27156,"58845":27127,"58846":27111,"58847":27200,"58848":27144,"58849":27110,"58850":27131,"58851":27149,"58852":27132,"58853":27115,"58854":27145,"58855":27140,"58856":27160,"58857":27173,"58858":27151,"58859":27126,"58860":27174,"58861":27143,"58862":27124,"58863":27158,"58864":27473,"58865":27557,"58866":27555,"58867":27554,"58868":27558,"58869":27649,"58870":27648,"58871":27647,"58872":27650,"58873":28481,"58874":28454,"58875":28542,"58876":28551,"58877":28614,"58878":28562,"58944":28557,"58945":28553,"58946":28556,"58947":28514,"58948":28495,"58949":28549,"58950":28506,"58951":28566,"58952":28534,"58953":28524,"58954":28546,"58955":28501,"58956":28530,"58957":28498,"58958":28496,"58959":28503,"58960":28564,"58961":28563,"58962":28509,"58963":28416,"58964":28513,"58965":28523,"58966":28541,"58967":28519,"58968":28560,"58969":28499,"58970":28555,"58971":28521,"58972":28543,"58973":28565,"58974":28515,"58975":28535,"58976":28522,"58977":28539,"58978":29106,"58979":29103,"58980":29083,"58981":29104,"58982":29088,"58983":29082,"58984":29097,"58985":29109,"58986":29085,"58987":29093,"58988":29086,"58989":29092,"58990":29089,"58991":29098,"58992":29084,"58993":29095,"58994":29107,"58995":29336,"58996":29338,"58997":29528,"58998":29522,"58999":29534,"59000":29535,"59001":29536,"59002":29533,"59003":29531,"59004":29537,"59005":29530,"59006":29529,"59041":29538,"59042":29831,"59043":29833,"59044":29834,"59045":29830,"59046":29825,"59047":29821,"59048":29829,"59049":29832,"59050":29820,"59051":29817,"59052":29960,"59053":29959,"59054":30078,"59055":30245,"59056":30238,"59057":30233,"59058":30237,"59059":30236,"59060":30243,"59061":30234,"59062":30248,"59063":30235,"59064":30364,"59065":30365,"59066":30366,"59067":30363,"59068":30605,"59069":30607,"59070":30601,"59071":30600,"59072":30925,"59073":30907,"59074":30927,"59075":30924,"59076":30929,"59077":30926,"59078":30932,"59079":30920,"59080":30915,"59081":30916,"59082":30921,"59083":31130,"59084":31137,"59085":31136,"59086":31132,"59087":31138,"59088":31131,"59089":27510,"59090":31289,"59091":31410,"59092":31412,"59093":31411,"59094":31671,"59095":31691,"59096":31678,"59097":31660,"59098":31694,"59099":31663,"59100":31673,"59101":31690,"59102":31669,"59103":31941,"59104":31944,"59105":31948,"59106":31947,"59107":32247,"59108":32219,"59109":32234,"59110":32231,"59111":32215,"59112":32225,"59113":32259,"59114":32250,"59115":32230,"59116":32246,"59117":32241,"59118":32240,"59119":32238,"59120":32223,"59121":32630,"59122":32684,"59123":32688,"59124":32685,"59125":32749,"59126":32747,"59127":32746,"59128":32748,"59129":32742,"59130":32744,"59131":32868,"59132":32871,"59133":33187,"59134":33183,"59200":33182,"59201":33173,"59202":33186,"59203":33177,"59204":33175,"59205":33302,"59206":33359,"59207":33363,"59208":33362,"59209":33360,"59210":33358,"59211":33361,"59212":34084,"59213":34107,"59214":34063,"59215":34048,"59216":34089,"59217":34062,"59218":34057,"59219":34061,"59220":34079,"59221":34058,"59222":34087,"59223":34076,"59224":34043,"59225":34091,"59226":34042,"59227":34056,"59228":34060,"59229":34036,"59230":34090,"59231":34034,"59232":34069,"59233":34039,"59234":34027,"59235":34035,"59236":34044,"59237":34066,"59238":34026,"59239":34025,"59240":34070,"59241":34046,"59242":34088,"59243":34077,"59244":34094,"59245":34050,"59246":34045,"59247":34078,"59248":34038,"59249":34097,"59250":34086,"59251":34023,"59252":34024,"59253":34032,"59254":34031,"59255":34041,"59256":34072,"59257":34080,"59258":34096,"59259":34059,"59260":34073,"59261":34095,"59262":34402,"59297":34646,"59298":34659,"59299":34660,"59300":34679,"59301":34785,"59302":34675,"59303":34648,"59304":34644,"59305":34651,"59306":34642,"59307":34657,"59308":34650,"59309":34641,"59310":34654,"59311":34669,"59312":34666,"59313":34640,"59314":34638,"59315":34655,"59316":34653,"59317":34671,"59318":34668,"59319":34682,"59320":34670,"59321":34652,"59322":34661,"59323":34639,"59324":34683,"59325":34677,"59326":34658,"59327":34663,"59328":34665,"59329":34906,"59330":35077,"59331":35084,"59332":35092,"59333":35083,"59334":35095,"59335":35096,"59336":35097,"59337":35078,"59338":35094,"59339":35089,"59340":35086,"59341":35081,"59342":35234,"59343":35236,"59344":35235,"59345":35309,"59346":35312,"59347":35308,"59348":35535,"59349":35526,"59350":35512,"59351":35539,"59352":35537,"59353":35540,"59354":35541,"59355":35515,"59356":35543,"59357":35518,"59358":35520,"59359":35525,"59360":35544,"59361":35523,"59362":35514,"59363":35517,"59364":35545,"59365":35902,"59366":35917,"59367":35983,"59368":36069,"59369":36063,"59370":36057,"59371":36072,"59372":36058,"59373":36061,"59374":36071,"59375":36256,"59376":36252,"59377":36257,"59378":36251,"59379":36384,"59380":36387,"59381":36389,"59382":36388,"59383":36398,"59384":36373,"59385":36379,"59386":36374,"59387":36369,"59388":36377,"59389":36390,"59390":36391,"59456":36372,"59457":36370,"59458":36376,"59459":36371,"59460":36380,"59461":36375,"59462":36378,"59463":36652,"59464":36644,"59465":36632,"59466":36634,"59467":36640,"59468":36643,"59469":36630,"59470":36631,"59471":36979,"59472":36976,"59473":36975,"59474":36967,"59475":36971,"59476":37167,"59477":37163,"59478":37161,"59479":37162,"59480":37170,"59481":37158,"59482":37166,"59483":37253,"59484":37254,"59485":37258,"59486":37249,"59487":37250,"59488":37252,"59489":37248,"59490":37584,"59491":37571,"59492":37572,"59493":37568,"59494":37593,"59495":37558,"59496":37583,"59497":37617,"59498":37599,"59499":37592,"59500":37609,"59501":37591,"59502":37597,"59503":37580,"59504":37615,"59505":37570,"59506":37608,"59507":37578,"59508":37576,"59509":37582,"59510":37606,"59511":37581,"59512":37589,"59513":37577,"59514":37600,"59515":37598,"59516":37607,"59517":37585,"59518":37587,"59553":37557,"59554":37601,"59555":37574,"59556":37556,"59557":38268,"59558":38316,"59559":38315,"59560":38318,"59561":38320,"59562":38564,"59563":38562,"59564":38611,"59565":38661,"59566":38664,"59567":38658,"59568":38746,"59569":38794,"59570":38798,"59571":38792,"59572":38864,"59573":38863,"59574":38942,"59575":38941,"59576":38950,"59577":38953,"59578":38952,"59579":38944,"59580":38939,"59581":38951,"59582":39090,"59583":39176,"59584":39162,"59585":39185,"59586":39188,"59587":39190,"59588":39191,"59589":39189,"59590":39388,"59591":39373,"59592":39375,"59593":39379,"59594":39380,"59595":39374,"59596":39369,"59597":39382,"59598":39384,"59599":39371,"59600":39383,"59601":39372,"59602":39603,"59603":39660,"59604":39659,"59605":39667,"59606":39666,"59607":39665,"59608":39750,"59609":39747,"59610":39783,"59611":39796,"59612":39793,"59613":39782,"59614":39798,"59615":39797,"59616":39792,"59617":39784,"59618":39780,"59619":39788,"59620":40188,"59621":40186,"59622":40189,"59623":40191,"59624":40183,"59625":40199,"59626":40192,"59627":40185,"59628":40187,"59629":40200,"59630":40197,"59631":40196,"59632":40579,"59633":40659,"59634":40719,"59635":40720,"59636":20764,"59637":20755,"59638":20759,"59639":20762,"59640":20753,"59641":20958,"59642":21300,"59643":21473,"59644":22128,"59645":22112,"59646":22126,"59712":22131,"59713":22118,"59714":22115,"59715":22125,"59716":22130,"59717":22110,"59718":22135,"59719":22300,"59720":22299,"59721":22728,"59722":22717,"59723":22729,"59724":22719,"59725":22714,"59726":22722,"59727":22716,"59728":22726,"59729":23319,"59730":23321,"59731":23323,"59732":23329,"59733":23316,"59734":23315,"59735":23312,"59736":23318,"59737":23336,"59738":23322,"59739":23328,"59740":23326,"59741":23535,"59742":23980,"59743":23985,"59744":23977,"59745":23975,"59746":23989,"59747":23984,"59748":23982,"59749":23978,"59750":23976,"59751":23986,"59752":23981,"59753":23983,"59754":23988,"59755":24167,"59756":24168,"59757":24166,"59758":24175,"59759":24297,"59760":24295,"59761":24294,"59762":24296,"59763":24293,"59764":24395,"59765":24508,"59766":24989,"59767":25000,"59768":24982,"59769":25029,"59770":25012,"59771":25030,"59772":25025,"59773":25036,"59774":25018,"59809":25023,"59810":25016,"59811":24972,"59812":25815,"59813":25814,"59814":25808,"59815":25807,"59816":25801,"59817":25789,"59818":25737,"59819":25795,"59820":25819,"59821":25843,"59822":25817,"59823":25907,"59824":25983,"59825":25980,"59826":26018,"59827":26312,"59828":26302,"59829":26304,"59830":26314,"59831":26315,"59832":26319,"59833":26301,"59834":26299,"59835":26298,"59836":26316,"59837":26403,"59838":27188,"59839":27238,"59840":27209,"59841":27239,"59842":27186,"59843":27240,"59844":27198,"59845":27229,"59846":27245,"59847":27254,"59848":27227,"59849":27217,"59850":27176,"59851":27226,"59852":27195,"59853":27199,"59854":27201,"59855":27242,"59856":27236,"59857":27216,"59858":27215,"59859":27220,"59860":27247,"59861":27241,"59862":27232,"59863":27196,"59864":27230,"59865":27222,"59866":27221,"59867":27213,"59868":27214,"59869":27206,"59870":27477,"59871":27476,"59872":27478,"59873":27559,"59874":27562,"59875":27563,"59876":27592,"59877":27591,"59878":27652,"59879":27651,"59880":27654,"59881":28589,"59882":28619,"59883":28579,"59884":28615,"59885":28604,"59886":28622,"59887":28616,"59888":28510,"59889":28612,"59890":28605,"59891":28574,"59892":28618,"59893":28584,"59894":28676,"59895":28581,"59896":28590,"59897":28602,"59898":28588,"59899":28586,"59900":28623,"59901":28607,"59902":28600,"59968":28578,"59969":28617,"59970":28587,"59971":28621,"59972":28591,"59973":28594,"59974":28592,"59975":29125,"59976":29122,"59977":29119,"59978":29112,"59979":29142,"59980":29120,"59981":29121,"59982":29131,"59983":29140,"59984":29130,"59985":29127,"59986":29135,"59987":29117,"59988":29144,"59989":29116,"59990":29126,"59991":29146,"59992":29147,"59993":29341,"59994":29342,"59995":29545,"59996":29542,"59997":29543,"59998":29548,"59999":29541,"60000":29547,"60001":29546,"60002":29823,"60003":29850,"60004":29856,"60005":29844,"60006":29842,"60007":29845,"60008":29857,"60009":29963,"60010":30080,"60011":30255,"60012":30253,"60013":30257,"60014":30269,"60015":30259,"60016":30268,"60017":30261,"60018":30258,"60019":30256,"60020":30395,"60021":30438,"60022":30618,"60023":30621,"60024":30625,"60025":30620,"60026":30619,"60027":30626,"60028":30627,"60029":30613,"60030":30617,"60065":30615,"60066":30941,"60067":30953,"60068":30949,"60069":30954,"60070":30942,"60071":30947,"60072":30939,"60073":30945,"60074":30946,"60075":30957,"60076":30943,"60077":30944,"60078":31140,"60079":31300,"60080":31304,"60081":31303,"60082":31414,"60083":31416,"60084":31413,"60085":31409,"60086":31415,"60087":31710,"60088":31715,"60089":31719,"60090":31709,"60091":31701,"60092":31717,"60093":31706,"60094":31720,"60095":31737,"60096":31700,"60097":31722,"60098":31714,"60099":31708,"60100":31723,"60101":31704,"60102":31711,"60103":31954,"60104":31956,"60105":31959,"60106":31952,"60107":31953,"60108":32274,"60109":32289,"60110":32279,"60111":32268,"60112":32287,"60113":32288,"60114":32275,"60115":32270,"60116":32284,"60117":32277,"60118":32282,"60119":32290,"60120":32267,"60121":32271,"60122":32278,"60123":32269,"60124":32276,"60125":32293,"60126":32292,"60127":32579,"60128":32635,"60129":32636,"60130":32634,"60131":32689,"60132":32751,"60133":32810,"60134":32809,"60135":32876,"60136":33201,"60137":33190,"60138":33198,"60139":33209,"60140":33205,"60141":33195,"60142":33200,"60143":33196,"60144":33204,"60145":33202,"60146":33207,"60147":33191,"60148":33266,"60149":33365,"60150":33366,"60151":33367,"60152":34134,"60153":34117,"60154":34155,"60155":34125,"60156":34131,"60157":34145,"60158":34136,"60224":34112,"60225":34118,"60226":34148,"60227":34113,"60228":34146,"60229":34116,"60230":34129,"60231":34119,"60232":34147,"60233":34110,"60234":34139,"60235":34161,"60236":34126,"60237":34158,"60238":34165,"60239":34133,"60240":34151,"60241":34144,"60242":34188,"60243":34150,"60244":34141,"60245":34132,"60246":34149,"60247":34156,"60248":34403,"60249":34405,"60250":34404,"60251":34715,"60252":34703,"60253":34711,"60254":34707,"60255":34706,"60256":34696,"60257":34689,"60258":34710,"60259":34712,"60260":34681,"60261":34695,"60262":34723,"60263":34693,"60264":34704,"60265":34705,"60266":34717,"60267":34692,"60268":34708,"60269":34716,"60270":34714,"60271":34697,"60272":35102,"60273":35110,"60274":35120,"60275":35117,"60276":35118,"60277":35111,"60278":35121,"60279":35106,"60280":35113,"60281":35107,"60282":35119,"60283":35116,"60284":35103,"60285":35313,"60286":35552,"60321":35554,"60322":35570,"60323":35572,"60324":35573,"60325":35549,"60326":35604,"60327":35556,"60328":35551,"60329":35568,"60330":35528,"60331":35550,"60332":35553,"60333":35560,"60334":35583,"60335":35567,"60336":35579,"60337":35985,"60338":35986,"60339":35984,"60340":36085,"60341":36078,"60342":36081,"60343":36080,"60344":36083,"60345":36204,"60346":36206,"60347":36261,"60348":36263,"60349":36403,"60350":36414,"60351":36408,"60352":36416,"60353":36421,"60354":36406,"60355":36412,"60356":36413,"60357":36417,"60358":36400,"60359":36415,"60360":36541,"60361":36662,"60362":36654,"60363":36661,"60364":36658,"60365":36665,"60366":36663,"60367":36660,"60368":36982,"60369":36985,"60370":36987,"60371":36998,"60372":37114,"60373":37171,"60374":37173,"60375":37174,"60376":37267,"60377":37264,"60378":37265,"60379":37261,"60380":37263,"60381":37671,"60382":37662,"60383":37640,"60384":37663,"60385":37638,"60386":37647,"60387":37754,"60388":37688,"60389":37692,"60390":37659,"60391":37667,"60392":37650,"60393":37633,"60394":37702,"60395":37677,"60396":37646,"60397":37645,"60398":37579,"60399":37661,"60400":37626,"60401":37669,"60402":37651,"60403":37625,"60404":37623,"60405":37684,"60406":37634,"60407":37668,"60408":37631,"60409":37673,"60410":37689,"60411":37685,"60412":37674,"60413":37652,"60414":37644,"60480":37643,"60481":37630,"60482":37641,"60483":37632,"60484":37627,"60485":37654,"60486":38332,"60487":38349,"60488":38334,"60489":38329,"60490":38330,"60491":38326,"60492":38335,"60493":38325,"60494":38333,"60495":38569,"60496":38612,"60497":38667,"60498":38674,"60499":38672,"60500":38809,"60501":38807,"60502":38804,"60503":38896,"60504":38904,"60505":38965,"60506":38959,"60507":38962,"60508":39204,"60509":39199,"60510":39207,"60511":39209,"60512":39326,"60513":39406,"60514":39404,"60515":39397,"60516":39396,"60517":39408,"60518":39395,"60519":39402,"60520":39401,"60521":39399,"60522":39609,"60523":39615,"60524":39604,"60525":39611,"60526":39670,"60527":39674,"60528":39673,"60529":39671,"60530":39731,"60531":39808,"60532":39813,"60533":39815,"60534":39804,"60535":39806,"60536":39803,"60537":39810,"60538":39827,"60539":39826,"60540":39824,"60541":39802,"60542":39829,"60577":39805,"60578":39816,"60579":40229,"60580":40215,"60581":40224,"60582":40222,"60583":40212,"60584":40233,"60585":40221,"60586":40216,"60587":40226,"60588":40208,"60589":40217,"60590":40223,"60591":40584,"60592":40582,"60593":40583,"60594":40622,"60595":40621,"60596":40661,"60597":40662,"60598":40698,"60599":40722,"60600":40765,"60601":20774,"60602":20773,"60603":20770,"60604":20772,"60605":20768,"60606":20777,"60607":21236,"60608":22163,"60609":22156,"60610":22157,"60611":22150,"60612":22148,"60613":22147,"60614":22142,"60615":22146,"60616":22143,"60617":22145,"60618":22742,"60619":22740,"60620":22735,"60621":22738,"60622":23341,"60623":23333,"60624":23346,"60625":23331,"60626":23340,"60627":23335,"60628":23334,"60629":23343,"60630":23342,"60631":23419,"60632":23537,"60633":23538,"60634":23991,"60635":24172,"60636":24170,"60637":24510,"60638":24507,"60639":25027,"60640":25013,"60641":25020,"60642":25063,"60643":25056,"60644":25061,"60645":25060,"60646":25064,"60647":25054,"60648":25839,"60649":25833,"60650":25827,"60651":25835,"60652":25828,"60653":25832,"60654":25985,"60655":25984,"60656":26038,"60657":26074,"60658":26322,"60659":27277,"60660":27286,"60661":27265,"60662":27301,"60663":27273,"60664":27295,"60665":27291,"60666":27297,"60667":27294,"60668":27271,"60669":27283,"60670":27278,"60736":27285,"60737":27267,"60738":27304,"60739":27300,"60740":27281,"60741":27263,"60742":27302,"60743":27290,"60744":27269,"60745":27276,"60746":27282,"60747":27483,"60748":27565,"60749":27657,"60750":28620,"60751":28585,"60752":28660,"60753":28628,"60754":28643,"60755":28636,"60756":28653,"60757":28647,"60758":28646,"60759":28638,"60760":28658,"60761":28637,"60762":28642,"60763":28648,"60764":29153,"60765":29169,"60766":29160,"60767":29170,"60768":29156,"60769":29168,"60770":29154,"60771":29555,"60772":29550,"60773":29551,"60774":29847,"60775":29874,"60776":29867,"60777":29840,"60778":29866,"60779":29869,"60780":29873,"60781":29861,"60782":29871,"60783":29968,"60784":29969,"60785":29970,"60786":29967,"60787":30084,"60788":30275,"60789":30280,"60790":30281,"60791":30279,"60792":30372,"60793":30441,"60794":30645,"60795":30635,"60796":30642,"60797":30647,"60798":30646,"60833":30644,"60834":30641,"60835":30632,"60836":30704,"60837":30963,"60838":30973,"60839":30978,"60840":30971,"60841":30972,"60842":30962,"60843":30981,"60844":30969,"60845":30974,"60846":30980,"60847":31147,"60848":31144,"60849":31324,"60850":31323,"60851":31318,"60852":31320,"60853":31316,"60854":31322,"60855":31422,"60856":31424,"60857":31425,"60858":31749,"60859":31759,"60860":31730,"60861":31744,"60862":31743,"60863":31739,"60864":31758,"60865":31732,"60866":31755,"60867":31731,"60868":31746,"60869":31753,"60870":31747,"60871":31745,"60872":31736,"60873":31741,"60874":31750,"60875":31728,"60876":31729,"60877":31760,"60878":31754,"60879":31976,"60880":32301,"60881":32316,"60882":32322,"60883":32307,"60884":38984,"60885":32312,"60886":32298,"60887":32329,"60888":32320,"60889":32327,"60890":32297,"60891":32332,"60892":32304,"60893":32315,"60894":32310,"60895":32324,"60896":32314,"60897":32581,"60898":32639,"60899":32638,"60900":32637,"60901":32756,"60902":32754,"60903":32812,"60904":33211,"60905":33220,"60906":33228,"60907":33226,"60908":33221,"60909":33223,"60910":33212,"60911":33257,"60912":33371,"60913":33370,"60914":33372,"60915":34179,"60916":34176,"60917":34191,"60918":34215,"60919":34197,"60920":34208,"60921":34187,"60922":34211,"60923":34171,"60924":34212,"60925":34202,"60926":34206,"60992":34167,"60993":34172,"60994":34185,"60995":34209,"60996":34170,"60997":34168,"60998":34135,"60999":34190,"61000":34198,"61001":34182,"61002":34189,"61003":34201,"61004":34205,"61005":34177,"61006":34210,"61007":34178,"61008":34184,"61009":34181,"61010":34169,"61011":34166,"61012":34200,"61013":34192,"61014":34207,"61015":34408,"61016":34750,"61017":34730,"61018":34733,"61019":34757,"61020":34736,"61021":34732,"61022":34745,"61023":34741,"61024":34748,"61025":34734,"61026":34761,"61027":34755,"61028":34754,"61029":34764,"61030":34743,"61031":34735,"61032":34756,"61033":34762,"61034":34740,"61035":34742,"61036":34751,"61037":34744,"61038":34749,"61039":34782,"61040":34738,"61041":35125,"61042":35123,"61043":35132,"61044":35134,"61045":35137,"61046":35154,"61047":35127,"61048":35138,"61049":35245,"61050":35247,"61051":35246,"61052":35314,"61053":35315,"61054":35614,"61089":35608,"61090":35606,"61091":35601,"61092":35589,"61093":35595,"61094":35618,"61095":35599,"61096":35602,"61097":35605,"61098":35591,"61099":35597,"61100":35592,"61101":35590,"61102":35612,"61103":35603,"61104":35610,"61105":35919,"61106":35952,"61107":35954,"61108":35953,"61109":35951,"61110":35989,"61111":35988,"61112":36089,"61113":36207,"61114":36430,"61115":36429,"61116":36435,"61117":36432,"61118":36428,"61119":36423,"61120":36675,"61121":36672,"61122":36997,"61123":36990,"61124":37176,"61125":37274,"61126":37282,"61127":37275,"61128":37273,"61129":37279,"61130":37281,"61131":37277,"61132":37280,"61133":37793,"61134":37763,"61135":37807,"61136":37732,"61137":37718,"61138":37703,"61139":37756,"61140":37720,"61141":37724,"61142":37750,"61143":37705,"61144":37712,"61145":37713,"61146":37728,"61147":37741,"61148":37775,"61149":37708,"61150":37738,"61151":37753,"61152":37719,"61153":37717,"61154":37714,"61155":37711,"61156":37745,"61157":37751,"61158":37755,"61159":37729,"61160":37726,"61161":37731,"61162":37735,"61163":37760,"61164":37710,"61165":37721,"61166":38343,"61167":38336,"61168":38345,"61169":38339,"61170":38341,"61171":38327,"61172":38574,"61173":38576,"61174":38572,"61175":38688,"61176":38687,"61177":38680,"61178":38685,"61179":38681,"61180":38810,"61181":38817,"61182":38812,"61248":38814,"61249":38813,"61250":38869,"61251":38868,"61252":38897,"61253":38977,"61254":38980,"61255":38986,"61256":38985,"61257":38981,"61258":38979,"61259":39205,"61260":39211,"61261":39212,"61262":39210,"61263":39219,"61264":39218,"61265":39215,"61266":39213,"61267":39217,"61268":39216,"61269":39320,"61270":39331,"61271":39329,"61272":39426,"61273":39418,"61274":39412,"61275":39415,"61276":39417,"61277":39416,"61278":39414,"61279":39419,"61280":39421,"61281":39422,"61282":39420,"61283":39427,"61284":39614,"61285":39678,"61286":39677,"61287":39681,"61288":39676,"61289":39752,"61290":39834,"61291":39848,"61292":39838,"61293":39835,"61294":39846,"61295":39841,"61296":39845,"61297":39844,"61298":39814,"61299":39842,"61300":39840,"61301":39855,"61302":40243,"61303":40257,"61304":40295,"61305":40246,"61306":40238,"61307":40239,"61308":40241,"61309":40248,"61310":40240,"61345":40261,"61346":40258,"61347":40259,"61348":40254,"61349":40247,"61350":40256,"61351":40253,"61352":32757,"61353":40237,"61354":40586,"61355":40585,"61356":40589,"61357":40624,"61358":40648,"61359":40666,"61360":40699,"61361":40703,"61362":40740,"61363":40739,"61364":40738,"61365":40788,"61366":40864,"61367":20785,"61368":20781,"61369":20782,"61370":22168,"61371":22172,"61372":22167,"61373":22170,"61374":22173,"61375":22169,"61376":22896,"61377":23356,"61378":23657,"61379":23658,"61380":24000,"61381":24173,"61382":24174,"61383":25048,"61384":25055,"61385":25069,"61386":25070,"61387":25073,"61388":25066,"61389":25072,"61390":25067,"61391":25046,"61392":25065,"61393":25855,"61394":25860,"61395":25853,"61396":25848,"61397":25857,"61398":25859,"61399":25852,"61400":26004,"61401":26075,"61402":26330,"61403":26331,"61404":26328,"61405":27333,"61406":27321,"61407":27325,"61408":27361,"61409":27334,"61410":27322,"61411":27318,"61412":27319,"61413":27335,"61414":27316,"61415":27309,"61416":27486,"61417":27593,"61418":27659,"61419":28679,"61420":28684,"61421":28685,"61422":28673,"61423":28677,"61424":28692,"61425":28686,"61426":28671,"61427":28672,"61428":28667,"61429":28710,"61430":28668,"61431":28663,"61432":28682,"61433":29185,"61434":29183,"61435":29177,"61436":29187,"61437":29181,"61438":29558,"61504":29880,"61505":29888,"61506":29877,"61507":29889,"61508":29886,"61509":29878,"61510":29883,"61511":29890,"61512":29972,"61513":29971,"61514":30300,"61515":30308,"61516":30297,"61517":30288,"61518":30291,"61519":30295,"61520":30298,"61521":30374,"61522":30397,"61523":30444,"61524":30658,"61525":30650,"61526":30975,"61527":30988,"61528":30995,"61529":30996,"61530":30985,"61531":30992,"61532":30994,"61533":30993,"61534":31149,"61535":31148,"61536":31327,"61537":31772,"61538":31785,"61539":31769,"61540":31776,"61541":31775,"61542":31789,"61543":31773,"61544":31782,"61545":31784,"61546":31778,"61547":31781,"61548":31792,"61549":32348,"61550":32336,"61551":32342,"61552":32355,"61553":32344,"61554":32354,"61555":32351,"61556":32337,"61557":32352,"61558":32343,"61559":32339,"61560":32693,"61561":32691,"61562":32759,"61563":32760,"61564":32885,"61565":33233,"61566":33234,"61601":33232,"61602":33375,"61603":33374,"61604":34228,"61605":34246,"61606":34240,"61607":34243,"61608":34242,"61609":34227,"61610":34229,"61611":34237,"61612":34247,"61613":34244,"61614":34239,"61615":34251,"61616":34254,"61617":34248,"61618":34245,"61619":34225,"61620":34230,"61621":34258,"61622":34340,"61623":34232,"61624":34231,"61625":34238,"61626":34409,"61627":34791,"61628":34790,"61629":34786,"61630":34779,"61631":34795,"61632":34794,"61633":34789,"61634":34783,"61635":34803,"61636":34788,"61637":34772,"61638":34780,"61639":34771,"61640":34797,"61641":34776,"61642":34787,"61643":34724,"61644":34775,"61645":34777,"61646":34817,"61647":34804,"61648":34792,"61649":34781,"61650":35155,"61651":35147,"61652":35151,"61653":35148,"61654":35142,"61655":35152,"61656":35153,"61657":35145,"61658":35626,"61659":35623,"61660":35619,"61661":35635,"61662":35632,"61663":35637,"61664":35655,"61665":35631,"61666":35644,"61667":35646,"61668":35633,"61669":35621,"61670":35639,"61671":35622,"61672":35638,"61673":35630,"61674":35620,"61675":35643,"61676":35645,"61677":35642,"61678":35906,"61679":35957,"61680":35993,"61681":35992,"61682":35991,"61683":36094,"61684":36100,"61685":36098,"61686":36096,"61687":36444,"61688":36450,"61689":36448,"61690":36439,"61691":36438,"61692":36446,"61693":36453,"61694":36455,"61760":36443,"61761":36442,"61762":36449,"61763":36445,"61764":36457,"61765":36436,"61766":36678,"61767":36679,"61768":36680,"61769":36683,"61770":37160,"61771":37178,"61772":37179,"61773":37182,"61774":37288,"61775":37285,"61776":37287,"61777":37295,"61778":37290,"61779":37813,"61780":37772,"61781":37778,"61782":37815,"61783":37787,"61784":37789,"61785":37769,"61786":37799,"61787":37774,"61788":37802,"61789":37790,"61790":37798,"61791":37781,"61792":37768,"61793":37785,"61794":37791,"61795":37773,"61796":37809,"61797":37777,"61798":37810,"61799":37796,"61800":37800,"61801":37812,"61802":37795,"61803":37797,"61804":38354,"61805":38355,"61806":38353,"61807":38579,"61808":38615,"61809":38618,"61810":24002,"61811":38623,"61812":38616,"61813":38621,"61814":38691,"61815":38690,"61816":38693,"61817":38828,"61818":38830,"61819":38824,"61820":38827,"61821":38820,"61822":38826,"61857":38818,"61858":38821,"61859":38871,"61860":38873,"61861":38870,"61862":38872,"61863":38906,"61864":38992,"61865":38993,"61866":38994,"61867":39096,"61868":39233,"61869":39228,"61870":39226,"61871":39439,"61872":39435,"61873":39433,"61874":39437,"61875":39428,"61876":39441,"61877":39434,"61878":39429,"61879":39431,"61880":39430,"61881":39616,"61882":39644,"61883":39688,"61884":39684,"61885":39685,"61886":39721,"61887":39733,"61888":39754,"61889":39756,"61890":39755,"61891":39879,"61892":39878,"61893":39875,"61894":39871,"61895":39873,"61896":39861,"61897":39864,"61898":39891,"61899":39862,"61900":39876,"61901":39865,"61902":39869,"61903":40284,"61904":40275,"61905":40271,"61906":40266,"61907":40283,"61908":40267,"61909":40281,"61910":40278,"61911":40268,"61912":40279,"61913":40274,"61914":40276,"61915":40287,"61916":40280,"61917":40282,"61918":40590,"61919":40588,"61920":40671,"61921":40705,"61922":40704,"61923":40726,"61924":40741,"61925":40747,"61926":40746,"61927":40745,"61928":40744,"61929":40780,"61930":40789,"61931":20788,"61932":20789,"61933":21142,"61934":21239,"61935":21428,"61936":22187,"61937":22189,"61938":22182,"61939":22183,"61940":22186,"61941":22188,"61942":22746,"61943":22749,"61944":22747,"61945":22802,"61946":23357,"61947":23358,"61948":23359,"61949":24003,"61950":24176,"62016":24511,"62017":25083,"62018":25863,"62019":25872,"62020":25869,"62021":25865,"62022":25868,"62023":25870,"62024":25988,"62025":26078,"62026":26077,"62027":26334,"62028":27367,"62029":27360,"62030":27340,"62031":27345,"62032":27353,"62033":27339,"62034":27359,"62035":27356,"62036":27344,"62037":27371,"62038":27343,"62039":27341,"62040":27358,"62041":27488,"62042":27568,"62043":27660,"62044":28697,"62045":28711,"62046":28704,"62047":28694,"62048":28715,"62049":28705,"62050":28706,"62051":28707,"62052":28713,"62053":28695,"62054":28708,"62055":28700,"62056":28714,"62057":29196,"62058":29194,"62059":29191,"62060":29186,"62061":29189,"62062":29349,"62063":29350,"62064":29348,"62065":29347,"62066":29345,"62067":29899,"62068":29893,"62069":29879,"62070":29891,"62071":29974,"62072":30304,"62073":30665,"62074":30666,"62075":30660,"62076":30705,"62077":31005,"62078":31003,"62113":31009,"62114":31004,"62115":30999,"62116":31006,"62117":31152,"62118":31335,"62119":31336,"62120":31795,"62121":31804,"62122":31801,"62123":31788,"62124":31803,"62125":31980,"62126":31978,"62127":32374,"62128":32373,"62129":32376,"62130":32368,"62131":32375,"62132":32367,"62133":32378,"62134":32370,"62135":32372,"62136":32360,"62137":32587,"62138":32586,"62139":32643,"62140":32646,"62141":32695,"62142":32765,"62143":32766,"62144":32888,"62145":33239,"62146":33237,"62147":33380,"62148":33377,"62149":33379,"62150":34283,"62151":34289,"62152":34285,"62153":34265,"62154":34273,"62155":34280,"62156":34266,"62157":34263,"62158":34284,"62159":34290,"62160":34296,"62161":34264,"62162":34271,"62163":34275,"62164":34268,"62165":34257,"62166":34288,"62167":34278,"62168":34287,"62169":34270,"62170":34274,"62171":34816,"62172":34810,"62173":34819,"62174":34806,"62175":34807,"62176":34825,"62177":34828,"62178":34827,"62179":34822,"62180":34812,"62181":34824,"62182":34815,"62183":34826,"62184":34818,"62185":35170,"62186":35162,"62187":35163,"62188":35159,"62189":35169,"62190":35164,"62191":35160,"62192":35165,"62193":35161,"62194":35208,"62195":35255,"62196":35254,"62197":35318,"62198":35664,"62199":35656,"62200":35658,"62201":35648,"62202":35667,"62203":35670,"62204":35668,"62205":35659,"62206":35669,"62272":35665,"62273":35650,"62274":35666,"62275":35671,"62276":35907,"62277":35959,"62278":35958,"62279":35994,"62280":36102,"62281":36103,"62282":36105,"62283":36268,"62284":36266,"62285":36269,"62286":36267,"62287":36461,"62288":36472,"62289":36467,"62290":36458,"62291":36463,"62292":36475,"62293":36546,"62294":36690,"62295":36689,"62296":36687,"62297":36688,"62298":36691,"62299":36788,"62300":37184,"62301":37183,"62302":37296,"62303":37293,"62304":37854,"62305":37831,"62306":37839,"62307":37826,"62308":37850,"62309":37840,"62310":37881,"62311":37868,"62312":37836,"62313":37849,"62314":37801,"62315":37862,"62316":37834,"62317":37844,"62318":37870,"62319":37859,"62320":37845,"62321":37828,"62322":37838,"62323":37824,"62324":37842,"62325":37863,"62326":38269,"62327":38362,"62328":38363,"62329":38625,"62330":38697,"62331":38699,"62332":38700,"62333":38696,"62334":38694,"62369":38835,"62370":38839,"62371":38838,"62372":38877,"62373":38878,"62374":38879,"62375":39004,"62376":39001,"62377":39005,"62378":38999,"62379":39103,"62380":39101,"62381":39099,"62382":39102,"62383":39240,"62384":39239,"62385":39235,"62386":39334,"62387":39335,"62388":39450,"62389":39445,"62390":39461,"62391":39453,"62392":39460,"62393":39451,"62394":39458,"62395":39456,"62396":39463,"62397":39459,"62398":39454,"62399":39452,"62400":39444,"62401":39618,"62402":39691,"62403":39690,"62404":39694,"62405":39692,"62406":39735,"62407":39914,"62408":39915,"62409":39904,"62410":39902,"62411":39908,"62412":39910,"62413":39906,"62414":39920,"62415":39892,"62416":39895,"62417":39916,"62418":39900,"62419":39897,"62420":39909,"62421":39893,"62422":39905,"62423":39898,"62424":40311,"62425":40321,"62426":40330,"62427":40324,"62428":40328,"62429":40305,"62430":40320,"62431":40312,"62432":40326,"62433":40331,"62434":40332,"62435":40317,"62436":40299,"62437":40308,"62438":40309,"62439":40304,"62440":40297,"62441":40325,"62442":40307,"62443":40315,"62444":40322,"62445":40303,"62446":40313,"62447":40319,"62448":40327,"62449":40296,"62450":40596,"62451":40593,"62452":40640,"62453":40700,"62454":40749,"62455":40768,"62456":40769,"62457":40781,"62458":40790,"62459":40791,"62460":40792,"62461":21303,"62462":22194,"62528":22197,"62529":22195,"62530":22755,"62531":23365,"62532":24006,"62533":24007,"62534":24302,"62535":24303,"62536":24512,"62537":24513,"62538":25081,"62539":25879,"62540":25878,"62541":25877,"62542":25875,"62543":26079,"62544":26344,"62545":26339,"62546":26340,"62547":27379,"62548":27376,"62549":27370,"62550":27368,"62551":27385,"62552":27377,"62553":27374,"62554":27375,"62555":28732,"62556":28725,"62557":28719,"62558":28727,"62559":28724,"62560":28721,"62561":28738,"62562":28728,"62563":28735,"62564":28730,"62565":28729,"62566":28736,"62567":28731,"62568":28723,"62569":28737,"62570":29203,"62571":29204,"62572":29352,"62573":29565,"62574":29564,"62575":29882,"62576":30379,"62577":30378,"62578":30398,"62579":30445,"62580":30668,"62581":30670,"62582":30671,"62583":30669,"62584":30706,"62585":31013,"62586":31011,"62587":31015,"62588":31016,"62589":31012,"62590":31017,"62625":31154,"62626":31342,"62627":31340,"62628":31341,"62629":31479,"62630":31817,"62631":31816,"62632":31818,"62633":31815,"62634":31813,"62635":31982,"62636":32379,"62637":32382,"62638":32385,"62639":32384,"62640":32698,"62641":32767,"62642":32889,"62643":33243,"62644":33241,"62645":33291,"62646":33384,"62647":33385,"62648":34338,"62649":34303,"62650":34305,"62651":34302,"62652":34331,"62653":34304,"62654":34294,"62655":34308,"62656":34313,"62657":34309,"62658":34316,"62659":34301,"62660":34841,"62661":34832,"62662":34833,"62663":34839,"62664":34835,"62665":34838,"62666":35171,"62667":35174,"62668":35257,"62669":35319,"62670":35680,"62671":35690,"62672":35677,"62673":35688,"62674":35683,"62675":35685,"62676":35687,"62677":35693,"62678":36270,"62679":36486,"62680":36488,"62681":36484,"62682":36697,"62683":36694,"62684":36695,"62685":36693,"62686":36696,"62687":36698,"62688":37005,"62689":37187,"62690":37185,"62691":37303,"62692":37301,"62693":37298,"62694":37299,"62695":37899,"62696":37907,"62697":37883,"62698":37920,"62699":37903,"62700":37908,"62701":37886,"62702":37909,"62703":37904,"62704":37928,"62705":37913,"62706":37901,"62707":37877,"62708":37888,"62709":37879,"62710":37895,"62711":37902,"62712":37910,"62713":37906,"62714":37882,"62715":37897,"62716":37880,"62717":37898,"62718":37887,"62784":37884,"62785":37900,"62786":37878,"62787":37905,"62788":37894,"62789":38366,"62790":38368,"62791":38367,"62792":38702,"62793":38703,"62794":38841,"62795":38843,"62796":38909,"62797":38910,"62798":39008,"62799":39010,"62800":39011,"62801":39007,"62802":39105,"62803":39106,"62804":39248,"62805":39246,"62806":39257,"62807":39244,"62808":39243,"62809":39251,"62810":39474,"62811":39476,"62812":39473,"62813":39468,"62814":39466,"62815":39478,"62816":39465,"62817":39470,"62818":39480,"62819":39469,"62820":39623,"62821":39626,"62822":39622,"62823":39696,"62824":39698,"62825":39697,"62826":39947,"62827":39944,"62828":39927,"62829":39941,"62830":39954,"62831":39928,"62832":40000,"62833":39943,"62834":39950,"62835":39942,"62836":39959,"62837":39956,"62838":39945,"62839":40351,"62840":40345,"62841":40356,"62842":40349,"62843":40338,"62844":40344,"62845":40336,"62846":40347,"62881":40352,"62882":40340,"62883":40348,"62884":40362,"62885":40343,"62886":40353,"62887":40346,"62888":40354,"62889":40360,"62890":40350,"62891":40355,"62892":40383,"62893":40361,"62894":40342,"62895":40358,"62896":40359,"62897":40601,"62898":40603,"62899":40602,"62900":40677,"62901":40676,"62902":40679,"62903":40678,"62904":40752,"62905":40750,"62906":40795,"62907":40800,"62908":40798,"62909":40797,"62910":40793,"62911":40849,"62912":20794,"62913":20793,"62914":21144,"62915":21143,"62916":22211,"62917":22205,"62918":22206,"62919":23368,"62920":23367,"62921":24011,"62922":24015,"62923":24305,"62924":25085,"62925":25883,"62926":27394,"62927":27388,"62928":27395,"62929":27384,"62930":27392,"62931":28739,"62932":28740,"62933":28746,"62934":28744,"62935":28745,"62936":28741,"62937":28742,"62938":29213,"62939":29210,"62940":29209,"62941":29566,"62942":29975,"62943":30314,"62944":30672,"62945":31021,"62946":31025,"62947":31023,"62948":31828,"62949":31827,"62950":31986,"62951":32394,"62952":32391,"62953":32392,"62954":32395,"62955":32390,"62956":32397,"62957":32589,"62958":32699,"62959":32816,"62960":33245,"62961":34328,"62962":34346,"62963":34342,"62964":34335,"62965":34339,"62966":34332,"62967":34329,"62968":34343,"62969":34350,"62970":34337,"62971":34336,"62972":34345,"62973":34334,"62974":34341,"63040":34857,"63041":34845,"63042":34843,"63043":34848,"63044":34852,"63045":34844,"63046":34859,"63047":34890,"63048":35181,"63049":35177,"63050":35182,"63051":35179,"63052":35322,"63053":35705,"63054":35704,"63055":35653,"63056":35706,"63057":35707,"63058":36112,"63059":36116,"63060":36271,"63061":36494,"63062":36492,"63063":36702,"63064":36699,"63065":36701,"63066":37190,"63067":37188,"63068":37189,"63069":37305,"63070":37951,"63071":37947,"63072":37942,"63073":37929,"63074":37949,"63075":37948,"63076":37936,"63077":37945,"63078":37930,"63079":37943,"63080":37932,"63081":37952,"63082":37937,"63083":38373,"63084":38372,"63085":38371,"63086":38709,"63087":38714,"63088":38847,"63089":38881,"63090":39012,"63091":39113,"63092":39110,"63093":39104,"63094":39256,"63095":39254,"63096":39481,"63097":39485,"63098":39494,"63099":39492,"63100":39490,"63101":39489,"63102":39482,"63137":39487,"63138":39629,"63139":39701,"63140":39703,"63141":39704,"63142":39702,"63143":39738,"63144":39762,"63145":39979,"63146":39965,"63147":39964,"63148":39980,"63149":39971,"63150":39976,"63151":39977,"63152":39972,"63153":39969,"63154":40375,"63155":40374,"63156":40380,"63157":40385,"63158":40391,"63159":40394,"63160":40399,"63161":40382,"63162":40389,"63163":40387,"63164":40379,"63165":40373,"63166":40398,"63167":40377,"63168":40378,"63169":40364,"63170":40392,"63171":40369,"63172":40365,"63173":40396,"63174":40371,"63175":40397,"63176":40370,"63177":40570,"63178":40604,"63179":40683,"63180":40686,"63181":40685,"63182":40731,"63183":40728,"63184":40730,"63185":40753,"63186":40782,"63187":40805,"63188":40804,"63189":40850,"63190":20153,"63191":22214,"63192":22213,"63193":22219,"63194":22897,"63195":23371,"63196":23372,"63197":24021,"63198":24017,"63199":24306,"63200":25889,"63201":25888,"63202":25894,"63203":25890,"63204":27403,"63205":27400,"63206":27401,"63207":27661,"63208":28757,"63209":28758,"63210":28759,"63211":28754,"63212":29214,"63213":29215,"63214":29353,"63215":29567,"63216":29912,"63217":29909,"63218":29913,"63219":29911,"63220":30317,"63221":30381,"63222":31029,"63223":31156,"63224":31344,"63225":31345,"63226":31831,"63227":31836,"63228":31833,"63229":31835,"63230":31834,"63296":31988,"63297":31985,"63298":32401,"63299":32591,"63300":32647,"63301":33246,"63302":33387,"63303":34356,"63304":34357,"63305":34355,"63306":34348,"63307":34354,"63308":34358,"63309":34860,"63310":34856,"63311":34854,"63312":34858,"63313":34853,"63314":35185,"63315":35263,"63316":35262,"63317":35323,"63318":35710,"63319":35716,"63320":35714,"63321":35718,"63322":35717,"63323":35711,"63324":36117,"63325":36501,"63326":36500,"63327":36506,"63328":36498,"63329":36496,"63330":36502,"63331":36503,"63332":36704,"63333":36706,"63334":37191,"63335":37964,"63336":37968,"63337":37962,"63338":37963,"63339":37967,"63340":37959,"63341":37957,"63342":37960,"63343":37961,"63344":37958,"63345":38719,"63346":38883,"63347":39018,"63348":39017,"63349":39115,"63350":39252,"63351":39259,"63352":39502,"63353":39507,"63354":39508,"63355":39500,"63356":39503,"63357":39496,"63358":39498,"63393":39497,"63394":39506,"63395":39504,"63396":39632,"63397":39705,"63398":39723,"63399":39739,"63400":39766,"63401":39765,"63402":40006,"63403":40008,"63404":39999,"63405":40004,"63406":39993,"63407":39987,"63408":40001,"63409":39996,"63410":39991,"63411":39988,"63412":39986,"63413":39997,"63414":39990,"63415":40411,"63416":40402,"63417":40414,"63418":40410,"63419":40395,"63420":40400,"63421":40412,"63422":40401,"63423":40415,"63424":40425,"63425":40409,"63426":40408,"63427":40406,"63428":40437,"63429":40405,"63430":40413,"63431":40630,"63432":40688,"63433":40757,"63434":40755,"63435":40754,"63436":40770,"63437":40811,"63438":40853,"63439":40866,"63440":20797,"63441":21145,"63442":22760,"63443":22759,"63444":22898,"63445":23373,"63446":24024,"63447":34863,"63448":24399,"63449":25089,"63450":25091,"63451":25092,"63452":25897,"63453":25893,"63454":26006,"63455":26347,"63456":27409,"63457":27410,"63458":27407,"63459":27594,"63460":28763,"63461":28762,"63462":29218,"63463":29570,"63464":29569,"63465":29571,"63466":30320,"63467":30676,"63468":31847,"63469":31846,"63470":32405,"63471":33388,"63472":34362,"63473":34368,"63474":34361,"63475":34364,"63476":34353,"63477":34363,"63478":34366,"63479":34864,"63480":34866,"63481":34862,"63482":34867,"63483":35190,"63484":35188,"63485":35187,"63486":35326,"63552":35724,"63553":35726,"63554":35723,"63555":35720,"63556":35909,"63557":36121,"63558":36504,"63559":36708,"63560":36707,"63561":37308,"63562":37986,"63563":37973,"63564":37981,"63565":37975,"63566":37982,"63567":38852,"63568":38853,"63569":38912,"63570":39510,"63571":39513,"63572":39710,"63573":39711,"63574":39712,"63575":40018,"63576":40024,"63577":40016,"63578":40010,"63579":40013,"63580":40011,"63581":40021,"63582":40025,"63583":40012,"63584":40014,"63585":40443,"63586":40439,"63587":40431,"63588":40419,"63589":40427,"63590":40440,"63591":40420,"63592":40438,"63593":40417,"63594":40430,"63595":40422,"63596":40434,"63597":40432,"63598":40418,"63599":40428,"63600":40436,"63601":40435,"63602":40424,"63603":40429,"63604":40642,"63605":40656,"63606":40690,"63607":40691,"63608":40710,"63609":40732,"63610":40760,"63611":40759,"63612":40758,"63613":40771,"63614":40783,"63649":40817,"63650":40816,"63651":40814,"63652":40815,"63653":22227,"63654":22221,"63655":23374,"63656":23661,"63657":25901,"63658":26349,"63659":26350,"63660":27411,"63661":28767,"63662":28769,"63663":28765,"63664":28768,"63665":29219,"63666":29915,"63667":29925,"63668":30677,"63669":31032,"63670":31159,"63671":31158,"63672":31850,"63673":32407,"63674":32649,"63675":33389,"63676":34371,"63677":34872,"63678":34871,"63679":34869,"63680":34891,"63681":35732,"63682":35733,"63683":36510,"63684":36511,"63685":36512,"63686":36509,"63687":37310,"63688":37309,"63689":37314,"63690":37995,"63691":37992,"63692":37993,"63693":38629,"63694":38726,"63695":38723,"63696":38727,"63697":38855,"63698":38885,"63699":39518,"63700":39637,"63701":39769,"63702":40035,"63703":40039,"63704":40038,"63705":40034,"63706":40030,"63707":40032,"63708":40450,"63709":40446,"63710":40455,"63711":40451,"63712":40454,"63713":40453,"63714":40448,"63715":40449,"63716":40457,"63717":40447,"63718":40445,"63719":40452,"63720":40608,"63721":40734,"63722":40774,"63723":40820,"63724":40821,"63725":40822,"63726":22228,"63727":25902,"63728":26040,"63729":27416,"63730":27417,"63731":27415,"63732":27418,"63733":28770,"63734":29222,"63735":29354,"63736":30680,"63737":30681,"63738":31033,"63739":31849,"63740":31851,"63741":31990,"63742":32410,"63808":32408,"63809":32411,"63810":32409,"63811":33248,"63812":33249,"63813":34374,"63814":34375,"63815":34376,"63816":35193,"63817":35194,"63818":35196,"63819":35195,"63820":35327,"63821":35736,"63822":35737,"63823":36517,"63824":36516,"63825":36515,"63826":37998,"63827":37997,"63828":37999,"63829":38001,"63830":38003,"63831":38729,"63832":39026,"63833":39263,"63834":40040,"63835":40046,"63836":40045,"63837":40459,"63838":40461,"63839":40464,"63840":40463,"63841":40466,"63842":40465,"63843":40609,"63844":40693,"63845":40713,"63846":40775,"63847":40824,"63848":40827,"63849":40826,"63850":40825,"63851":22302,"63852":28774,"63853":31855,"63854":34876,"63855":36274,"63856":36518,"63857":37315,"63858":38004,"63859":38008,"63860":38006,"63861":38005,"63862":39520,"63863":40052,"63864":40051,"63865":40049,"63866":40053,"63867":40468,"63868":40467,"63869":40694,"63870":40714,"63905":40868,"63906":28776,"63907":28773,"63908":31991,"63909":34410,"63910":34878,"63911":34877,"63912":34879,"63913":35742,"63914":35996,"63915":36521,"63916":36553,"63917":38731,"63918":39027,"63919":39028,"63920":39116,"63921":39265,"63922":39339,"63923":39524,"63924":39526,"63925":39527,"63926":39716,"63927":40469,"63928":40471,"63929":40776,"63930":25095,"63931":27422,"63932":29223,"63933":34380,"63934":36520,"63935":38018,"63936":38016,"63937":38017,"63938":39529,"63939":39528,"63940":39726,"63941":40473,"63942":29225,"63943":34379,"63944":35743,"63945":38019,"63946":40057,"63947":40631,"63948":30325,"63949":39531,"63950":40058,"63951":40477,"63952":28777,"63953":28778,"63954":40612,"63955":40830,"63956":40777,"63957":40856,"63958":30849,"63959":37561,"63960":35023,"63961":22715,"63962":24658,"63963":31911,"63964":23290,"63965":9556,"63966":9574,"63967":9559,"63968":9568,"63969":9580,"63970":9571,"63971":9562,"63972":9577,"63973":9565,"63974":9554,"63975":9572,"63976":9557,"63977":9566,"63978":9578,"63979":9569,"63980":9560,"63981":9575,"63982":9563,"63983":9555,"63984":9573,"63985":9558,"63986":9567,"63987":9579,"63988":9570,"63989":9561,"63990":9576,"63991":9564,"63992":9553,"63993":9552,"63994":9581,"63995":9582,"63996":9584,"63997":9583,"63998":9619,"64064":57344,"64065":57345,"64066":57346,"64067":57347,"64068":57348,"64069":57349,"64070":57350,"64071":57351,"64072":57352,"64073":57353,"64074":57354,"64075":57355,"64076":57356,"64077":57357,"64078":57358,"64079":57359,"64080":57360,"64081":57361,"64082":57362,"64083":57363,"64084":57364,"64085":57365,"64086":57366,"64087":57367,"64088":57368,"64089":57369,"64090":57370,"64091":57371,"64092":57372,"64093":57373,"64094":57374,"64095":57375,"64096":57376,"64097":57377,"64098":57378,"64099":57379,"64100":29234,"64101":29244,"64102":29286,"64103":29314,"64104":29327,"64105":29343,"64106":29357,"64107":29361,"64108":29368,"64109":29374,"64110":29389,"64111":29403,"64112":29476,"64113":29487,"64114":29496,"64115":29497,"64116":29629,"64117":29646,"64118":29681,"64119":29814,"64120":29858,"64121":29953,"64122":29977,"64123":29987,"64124":30012,"64125":30020,"64126":30025,"64161":30029,"64162":30061,"64163":30082,"64164":30083,"64165":30089,"64166":30124,"64167":30166,"64168":30185,"64169":30272,"64170":30285,"64171":30292,"64172":30312,"64173":30336,"64174":30339,"64175":30352,"64176":30391,"64177":30393,"64178":30477,"64179":30494,"64180":30531,"64181":30744,"64182":30748,"64183":30777,"64184":30780,"64185":30791,"64186":30806,"64187":30842,"64188":30901,"64189":30905,"64190":30918,"64191":30937,"64192":30983,"64193":31024,"64194":31028,"64195":31035,"64196":31104,"64197":31133,"64198":31171,"64199":31201,"64200":31238,"64201":31246,"64202":31299,"64203":31312,"64204":31427,"64205":31442,"64206":31458,"64207":31463,"64208":31480,"64209":31542,"64210":31586,"64211":31596,"64212":31610,"64213":31611,"64214":31642,"64215":31646,"64216":31647,"64217":31650,"64218":31655,"64219":31734,"64220":31762,"64221":31764,"64222":31823,"64223":31830,"64224":31832,"64225":31915,"64226":31994,"64227":32072,"64228":32075,"64229":32119,"64230":32212,"64231":32213,"64232":32214,"64233":32228,"64234":32333,"64235":32349,"64236":32383,"64237":32393,"64238":32398,"64239":32402,"64240":32468,"64241":32497,"64242":32530,"64243":32560,"64244":32625,"64245":32642,"64246":32686,"64247":32710,"64248":32800,"64249":32802,"64250":32805,"64251":32817,"64252":32863,"64253":32872,"64254":32940,"64320":32951,"64321":20890,"64322":21526,"64323":21524,"64324":13535,"64325":19581,"64326":25283,"64327":57508,"64328":57509,"64329":57510,"64330":21707,"64331":57512,"64332":21948,"64333":32950,"64334":20903,"64335":57516,"64336":57517,"64337":57518,"64338":21779,"64339":33318,"64340":57521,"64341":21790,"64342":21982,"64343":25529,"64344":26776,"64345":57526,"64346":21762,"64347":21865,"64348":30132,"64349":25596,"64350":40580,"64351":37418,"64352":57533,"64353":57534,"64354":57535,"64355":35015,"64356":24734,"64357":22053,"64358":28997,"64359":23282,"64360":57541,"64361":21135,"64362":22095,"64363":30611,"64364":34694,"64365":36397,"64366":33206,"64367":13822,"64368":29174,"64369":57550,"64370":34820,"64371":37765,"64372":57553,"64373":57554,"64374":30310,"64375":57556,"64376":40050,"64377":57558,"64378":25294,"64379":57560,"64380":40598,"64381":18825,"64382":31955,"64417":36570,"64418":40619,"64419":25831,"64420":57567,"64421":33450,"64422":26471,"64423":28018,"64424":30982,"64425":31172,"64426":32590,"64427":34798,"64428":57575,"64429":33726,"64430":34351,"64431":35237,"64432":17935,"64433":57580,"64434":39112,"64435":39232,"64436":39245,"64437":39436,"64438":39639,"64439":40600,"64440":40742,"64441":57588,"64442":20227,"64443":57590,"64444":20281,"64445":20274,"64446":20395,"64447":20566,"64448":57595,"64449":20526,"64450":20646,"64451":20697,"64452":20750,"64453":20717,"64454":20737,"64455":20980,"64456":21023,"64457":21088,"64458":21079,"64459":21146,"64460":21201,"64461":21216,"64462":21217,"64463":20947,"64464":20959,"64465":30022,"64466":20990,"64467":21298,"64468":21292,"64469":21299,"64470":21419,"64471":21418,"64472":40846,"64473":21609,"64474":21660,"64475":21466,"64476":27338,"64477":21875,"64478":57625,"64479":13782,"64480":57627,"64481":22033,"64482":22093,"64483":57630,"64484":22100,"64485":13811,"64486":57633,"64487":22342,"64488":22394,"64489":22375,"64490":22586,"64491":22502,"64492":22493,"64493":22592,"64494":57641,"64495":22566,"64496":22748,"64497":22967,"64498":23001,"64499":23584,"64500":57647,"64501":23761,"64502":23785,"64503":23878,"64504":23950,"64505":57652,"64506":24053,"64507":24075,"64508":24082,"64509":24110,"64510":24158,"64576":57658,"64577":24397,"64578":31357,"64579":23491,"64580":31419,"64581":57663,"64582":57664,"64583":24484,"64584":24506,"64585":24508,"64586":57668,"64587":24695,"64588":24740,"64589":24755,"64590":24829,"64591":24880,"64592":57674,"64593":24988,"64594":24921,"64595":24957,"64596":24924,"64597":25471,"64598":25058,"64599":28885,"64600":25145,"64601":25192,"64602":25221,"64603":25218,"64604":25254,"64605":25301,"64606":25444,"64607":25397,"64608":25744,"64609":14940,"64610":26184,"64611":26215,"64612":26398,"64613":26627,"64614":26540,"64615":26617,"64616":26806,"64617":26924,"64618":26881,"64619":26880,"64620":26826,"64621":26995,"64622":27008,"64623":26942,"64624":57706,"64625":27058,"64626":27072,"64627":27018,"64628":27130,"64629":27113,"64630":27314,"64631":27218,"64632":27293,"64633":27421,"64634":27474,"64635":27642,"64636":15569,"64637":27854,"64638":28239,"64673":28089,"64674":28484,"64675":57723,"64676":28634,"64677":28801,"64678":31180,"64679":28980,"64680":15820,"64681":29046,"64682":57730,"64683":57731,"64684":29205,"64685":29264,"64686":29319,"64687":29484,"64688":29362,"64689":29410,"64690":29442,"64691":29512,"64692":29480,"64693":29519,"64694":29553,"64695":25989,"64696":57744,"64697":29789,"64698":29800,"64699":29982,"64700":30035,"64701":30074,"64702":30369,"64703":30412,"64704":30500,"64705":30507,"64706":16485,"64707":30803,"64708":30931,"64709":30936,"64710":40318,"64711":30895,"64712":57760,"64713":24898,"64714":31145,"64715":39994,"64716":31188,"64717":57765,"64718":31277,"64719":31294,"64720":31305,"64721":31453,"64722":31450,"64723":30147,"64724":30215,"64725":30210,"64726":57774,"64727":30311,"64728":30319,"64729":22048,"64730":35431,"64731":40727,"64732":31519,"64733":31634,"64734":31651,"64735":31695,"64736":57784,"64737":31740,"64738":31810,"64739":31825,"64740":31837,"64741":31856,"64742":31870,"64743":31878,"64744":31875,"64745":31916,"64746":31943,"64747":31938,"64748":57796,"64749":31962,"64750":57798,"64751":32077,"64752":32090,"64753":32245,"64754":32295,"64755":32366,"64756":40597,"64757":21107,"64758":32797,"64759":32866,"64760":32867,"64761":32870,"64762":32859,"64763":32934,"64764":33027,"64765":40577,"64766":33224,"64832":57815,"64833":36768,"64834":33270,"64835":33306,"64836":57819,"64837":34673,"64838":34729,"64839":34700,"64840":40606,"64841":34753,"64842":40476,"64843":57826,"64844":34774,"64845":34805,"64846":34831,"64847":34840,"64848":34861,"64849":34882,"64850":34885,"64851":39989,"64852":34926,"64853":34986,"64854":34976,"64855":25245,"64856":35139,"64857":35149,"64858":29042,"64859":34910,"64860":57843,"64861":33533,"64862":17591,"64863":33488,"64864":33669,"64865":40194,"64866":40809,"64867":33824,"64868":57851,"64869":34010,"64870":33965,"64871":17659,"64872":34123,"64873":57856,"64874":34306,"64875":34320,"64876":25553,"64877":35209,"64878":35210,"64879":35220,"64880":40005,"64881":35260,"64882":35454,"64883":35401,"64884":35596,"64885":35651,"64886":35713,"64887":35660,"64888":57871,"64889":36013,"64890":36075,"64891":36087,"64892":36108,"64893":36226,"64894":36262,"64929":36308,"64930":36392,"64931":36431,"64932":36471,"64933":36469,"64934":36519,"64935":36633,"64936":57885,"64937":36700,"64938":40260,"64939":37060,"64940":37201,"64941":57890,"64942":37212,"64943":37209,"64944":37223,"64945":37244,"64946":37262,"64947":37307,"64948":40616,"64949":36950,"64950":36940,"64951":37374,"64952":37474,"64953":37566,"64954":37739,"64955":37742,"64956":37818,"64957":37927,"64958":38295,"64959":38311,"64960":57909,"64961":38456,"64962":57911,"64963":38531,"64964":38550,"64965":38529,"64966":38589,"64967":38659,"64968":38689,"64969":38705,"64970":38751,"64971":38815,"64972":38836,"64973":38840,"64974":38842,"64975":38846,"64976":38856,"64977":40639,"64978":38943,"64979":38958,"64980":40869,"64981":38983,"64982":38987,"64983":39014,"64984":39020,"64985":39092,"64986":40794,"64987":39132,"64988":39142,"64989":39234,"64990":39225,"64991":39227,"64992":40787,"64993":39242,"64994":40773,"64995":19326,"64996":39386,"64997":31432,"64998":39610,"64999":39613,"65000":40706,"65001":39722,"65002":57951,"65003":39725,"65004":39650,"65005":39682,"65006":39679,"65007":19463,"65008":39689,"65009":19460,"65010":19515,"65011":39823,"65012":39837,"65013":39856,"65014":39948,"65015":39957,"65016":39946,"65017":39935,"65018":39982,"65019":33000,"65020":33001,"65021":33004,"65022":33038,"65088":27705,"65089":20074,"65090":38465,"65091":22770,"65092":31074,"65093":26658,"65094":57978,"65095":57979,"65096":33031,"65097":22487,"65098":17642,"65099":25653,"65100":34100,"65101":16607,"65102":57986,"65103":26906,"65104":39938,"65105":30129,"65106":33747,"65107":29041,"65108":27147,"65109":57993,"65110":27258,"65111":39668,"65112":57996,"65113":57997,"65114":30649,"65115":25904,"65116":28054,"65117":22071,"65118":26405,"65119":27179,"65120":32093,"65121":36961,"65122":20120,"65123":31910,"65124":31545,"65125":58009,"65126":22901,"65127":14023,"65128":28799,"65129":58013,"65130":28299,"65131":58015,"65132":58016,"65133":38749,"65134":37584,"65135":22356,"65136":58020,"65137":16089,"65138":58022,"65139":58023,"65140":24985,"65141":29792,"65142":28991,"65143":31022,"65144":23190,"65145":37704,"65146":26254,"65147":20477,"65148":37697,"65149":13908,"65150":23925,"65185":28702,"65186":25979,"65187":28813,"65188":24269,"65189":58039,"65190":24743,"65191":31408,"65192":24419,"65193":58043,"65194":29687,"65195":58045,"65196":29800,"65197":30132,"65198":58048,"65199":39785,"65200":189,"65201":8531,"65202":8532,"65203":188,"65204":190,"65205":8533,"65206":8534,"65207":8535,"65208":8536,"65209":8537,"65210":8538,"65211":34450,"65212":34464,"65213":34477,"65214":34482,"65215":34725,"65216":34737,"65217":8539,"65218":8540,"65219":8541,"65220":8542,"65221":34778,"65222":34895,"65223":34912,"65224":34951,"65225":34959,"65226":34960,"65227":35046,"65228":35071,"65229":35072,"65230":35108,"65231":35143,"65232":35156,"65233":35173,"65234":35200,"65235":35217,"65236":35356,"65237":35369,"65238":35371,"65239":35384,"65240":35389,"65241":8978,"65242":35472,"65243":35476,"65244":35484,"65245":35497,"65246":35503,"65247":35508,"65248":35562,"65249":35615,"65250":8240,"65251":35647,"65252":35661,"65253":35678,"65254":35682,"65255":35689,"65256":35739,"65257":35921,"65258":35995,"65259":35999,"65260":36052,"65261":36054,"65262":33042,"65263":33073,"65264":33078,"65265":33119,"65266":33133,"65267":33149,"65268":33171,"65269":33194,"65270":33208,"65271":33217,"65272":33321,"65273":33325,"65274":33326,"65275":33342,"65276":33378,"65277":33386,"65278":33416,"NaN":null}
},{}],68:[function(require,module,exports){
},{}],69:[function(require,module,exports){
(function (Buffer){
var RE_SPACEDASH = /[- ]/g;
// Module exports
var iconv = module.exports = {
    toEncoding: function(str, encoding) {
        return iconv.getCodec(encoding).toEncoding(str);
    },
    fromEncoding: function(buf, encoding) {
        return iconv.getCodec(encoding).fromEncoding(buf);
    },
    encodingExists: function(enc) {
        loadEncodings();
        enc = enc.replace(RE_SPACEDASH, "").toLowerCase();
        return (iconv.encodings[enc] !== undefined);
    },
    
    defaultCharUnicode: '�',
    defaultCharSingleByte: '?',

    encodingsLoaded: false,
    
    // Get correct codec for given encoding.
    getCodec: function(encoding) {
        loadEncodings();
        var enc = encoding || "utf8";
        var codecOptions = undefined;
        while (1) {
            if (getType(enc) === "String")
                enc = enc.replace(RE_SPACEDASH, "").toLowerCase();
            var codec = iconv.encodings[enc];
            var type = getType(codec);
            if (type === "String") {
                // Link to other encoding.
                codecOptions = {originalEncoding: enc};
                enc = codec;
            }
            else if (type === "Object" && codec.type != undefined) {
                // Options for other encoding.
                codecOptions = codec;
                enc = codec.type;
            } 
            else if (type === "Function")
                // Codec itself.
                return codec(codecOptions);
            else
                throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
        }
    },
    
    // Define basic encodings
    encodings: {
        internal: function(options) {
            return {
                toEncoding: toInternalEncoding,
                fromEncoding: fromInternalEncoding,
                options: options
            };
        },
        utf8: "internal",
        ucs2: "internal",
        binary: "internal",
        ascii: "internal",
        base64: "internal",
        
        // Codepage single-byte encodings.
        singlebyte: function(options) {
            // Prepare chars if needed
            if (!options.charsBuf) {
                if (!options.chars || (options.chars.length !== 128 && options.chars.length !== 256))
                    throw new Error("Encoding '"+options.type+"' has incorrect 'chars' (must be of len 128 or 256)");
                
                if (options.chars.length === 128)
                    options.chars = asciiString + options.chars;

                options.charsBuf = new Buffer(options.chars, 'ucs2');
            }
            
            if (!options.revCharsBuf) {
                options.revCharsBuf = new Buffer(65536);
                var defChar = iconv.defaultCharSingleByte.charCodeAt(0);
                for (var i = 0; i < options.revCharsBuf.length; i++)
                    options.revCharsBuf[i] = defChar;
                for (var i = 0; i < options.chars.length; i++)
                    options.revCharsBuf[options.chars.charCodeAt(i)] = i;
            }

            return {
                toEncoding: toSingleByteEncoding,
                fromEncoding: fromSingleByteEncoding,
                options: options,
            };
        },

        // Codepage double-byte encodings.
        table: function(options) {
            if (!options.table) {
                throw new Error("Encoding '" + options.type + "' has incorect 'table' option");
            }
            if (!options.revCharsTable) {
                var revCharsTable = options.revCharsTable = {};
                for (var i = 0; i <= 0xFFFF; i++) {
                    revCharsTable[i] = 0;
                }

                var table = options.table;
                for (var key in table) {
                    revCharsTable[table[key]] = +key;
                }
            }
            
            return {
                toEncoding: toTableEncoding,
                fromEncoding: fromTableEncoding,
                options: options,
            };
        }
    }
};

function toInternalEncoding(str) {
    return new Buffer(ensureString(str), this.options.originalEncoding);
}

function fromInternalEncoding(buf) {
    return ensureBuffer(buf).toString(this.options.originalEncoding);
}

function toTableEncoding(str) {
    str = ensureString(str);
    var strLen = str.length;
    var revCharsTable = this.options.revCharsTable;
    var newBuf = new Buffer(strLen*2), gbkcode, unicode,
        defaultChar = revCharsTable[iconv.defaultCharUnicode.charCodeAt(0)];

    for (var i = 0, j = 0; i < strLen; i++) {
        unicode = str.charCodeAt(i);
        if (unicode >> 7) {
            gbkcode = revCharsTable[unicode] || defaultChar;
            newBuf[j++] = gbkcode >> 8; //high byte;
            newBuf[j++] = gbkcode & 0xFF; //low byte
        } else {//ascii
            newBuf[j++] = unicode;
        }
    }
    return newBuf.slice(0, j);
}

function fromTableEncoding(buf) {
    buf = ensureBuffer(buf);
    var bufLen = buf.length;
    var table = this.options.table;
    var newBuf = new Buffer(bufLen*2), unicode, gbkcode,
        defaultChar = iconv.defaultCharUnicode.charCodeAt(0);

    for (var i = 0, j = 0; i < bufLen; i++, j+=2) {
        gbkcode = buf[i];
        if (gbkcode & 0x80) {
            gbkcode = (gbkcode << 8) + buf[++i];
            unicode = table[gbkcode] || defaultChar;
        } else {
            unicode = gbkcode;
        }
        newBuf[j] = unicode & 0xFF; //low byte
        newBuf[j+1] = unicode >> 8; //high byte
    }
    return newBuf.slice(0, j).toString('ucs2');
}

function toSingleByteEncoding(str) {
    str = ensureString(str);
    
    var buf = new Buffer(str.length);
    var revCharsBuf = this.options.revCharsBuf;
    for (var i = 0; i < str.length; i++)
        buf[i] = revCharsBuf[str.charCodeAt(i)];
    
    return buf;
}

function fromSingleByteEncoding(buf) {
    buf = ensureBuffer(buf);
    
    // Strings are immutable in JS -> we use ucs2 buffer to speed up computations.
    var charsBuf = this.options.charsBuf;
    var newBuf = new Buffer(buf.length*2);
                    
                    x1 = 0, idx2 = 0;
    for (var i = 0, _len = buf.length; i < _len; i++) {
        idx1 = buf[i]*2; idx2 = i*2;
        newBuf[idx2] = charsBuf[idx1];
        newBuf[idx2+1] = charsBuf[idx1+1];
    }
    return newBuf.toString('ucs2');
}

// Add aliases to convert functions
iconv.encode = iconv.toEncoding;
iconv.decode = iconv.fromEncoding;

// Load other encodings manually from files in /encodings dir.
function loadEncodings() {
    if (!iconv.encodingsLoaded) {
        [ require('./encodings/singlebyte'),
          require('./encodings/gbk'),
          require('./encodings/big5')
        ].forEach(function(encodings) {
            for (var key in encodings)
                iconv.encodings[key] = encodings[key]
        });
        iconv.encodingsLoaded = true;
    }
}



// Utilities
var asciiString = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f'+
              ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f';

var ensureBuffer = function(buf) {
    buf = buf || new Buffer(0);
    return (buf instanceof Buffer) ? buf : new Buffer(""+buf, "binary");
}

var ensureString = function(str) {
    str = str || "";
    return (str instanceof Buffer) ? str.toString('utf8') : (""+str);
}

var getType = function(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}


}).call(this,require("buffer").Buffer)
},{"./encodings/big5":64,"./encodings/gbk":65,"./encodings/singlebyte":66,"buffer":17}],70:[function(require,module,exports){
/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Object#hasOwnProperty ref
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Array#indexOf shim.
 */

var indexOf = typeof Array.prototype.indexOf === 'function'
  ? function(arr, el) { return arr.indexOf(el); }
  : function(arr, el) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) return i;
      }
      return -1;
    };

/**
 * Array.isArray shim.
 */

var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == '[object Array]';
};

/**
 * Object.keys shim.
 */

var objectKeys = Object.keys || function(obj) {
  var ret = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret.push(key);
    }
  }
  return ret;
};

/**
 * Array#forEach shim.
 */

var forEach = typeof Array.prototype.forEach === 'function'
  ? function(arr, fn) { return arr.forEach(fn); }
  : function(arr, fn) {
      for (var i = 0; i < arr.length; i++) fn(arr[i]);
    };

/**
 * Array#reduce shim.
 */

var reduce = function(arr, fn, initial) {
  if (typeof arr.reduce === 'function') return arr.reduce(fn, initial);
  var res = initial;
  for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
  return res;
};

/**
 * Cache non-integer test regexp.
 */

var isint = /^[0-9]+$/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {}
  var t = {};
  for (var i in parent[key]) {
    if (hasOwnProperty.call(parent[key], i)) {
      t[i] = parent[key][i];
    }
  }
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();
  
  // illegal
  if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
  
  // end
  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[objectKeys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~indexOf(part, ']')) {
      part = part.substr(0, part.length - 1);
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~indexOf(key, ']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Compact sparse arrays.
 */

function compact(obj) {
  if ('object' != typeof obj) return obj;

  if (isArray(obj)) {
    var ret = [];

    for (var i in obj) {
      if (hasOwnProperty.call(obj, i)) {
        ret.push(obj[i]);
      }
    }

    return ret;
  }

  for (var key in obj) {
    obj[key] = compact(obj[key]);
  }

  return obj;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };

  forEach(objectKeys(obj), function(name){
    merge(ret, name, obj[name]);
  });

  return compact(ret.base);
}

/**
 * Parse the given str.
 */

function parseString(str){
  var ret = reduce(String(str).split('&'), function(ret, pair){
    var eql = indexOf(pair, '=')
      , brace = lastBraceInKey(pair)
      , key = pair.substr(0, brace || eql)
      , val = pair.substr(brace || eql, pair.length)
      , val = val.substr(indexOf(val, '=') + 1, val.length);

    // ?foo
    if ('' == key) key = pair, val = '';
    if ('' == key) return ret;

    return merge(ret, decode(key), decode(val));
  }, { base: {} }).base;

  return compact(ret);
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + encodeURIComponent(String(obj));
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[' + i + ']'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if ('' == key) continue;
    if (null == obj[key]) {
      ret.push(encodeURIComponent(key) + '=');
    } else {
      ret.push(stringify(obj[key], prefix
        ? prefix + '[' + encodeURIComponent(key) + ']'
        : encodeURIComponent(key)));
    }
  }

  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

/**
 * Decode `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

},{}],71:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
(function() {
  var xml2js;

  xml2js = require('../lib/xml2js');

  exports.stripBOM = function(str) {
    if (str[0] === '\uFEFF') {
      return str.substring(1);
    } else {
      return str;
    }
  };

}).call(this);

},{"../lib/xml2js":72}],72:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var bom, builder, events, isEmpty, sax,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  sax = require('sax');

  events = require('events');

  builder = require('xmlbuilder');

  bom = require('./bom');

  isEmpty = function(thing) {
    return typeof thing === "object" && (thing != null) && Object.keys(thing).length === 0;
  };

  exports.defaults = {
    "0.1": {
      explicitCharkey: false,
      trim: true,
      normalize: true,
      normalizeTags: false,
      attrkey: "@",
      charkey: "#",
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: false,
      explicitRoot: false,
      validator: null,
      xmlns: false,
      explicitChildren: false,
      childkey: '@@',
      charsAsChildren: false,
      async: false,
      strict: true
    },
    "0.2": {
      explicitCharkey: false,
      trim: false,
      normalize: false,
      normalizeTags: false,
      attrkey: "$",
      charkey: "_",
      explicitArray: true,
      ignoreAttrs: false,
      mergeAttrs: false,
      explicitRoot: true,
      validator: null,
      xmlns: false,
      explicitChildren: false,
      childkey: '$$',
      charsAsChildren: false,
      async: false,
      strict: true,
      rootName: 'root',
      xmldec: {
        'version': '1.0',
        'encoding': 'UTF-8',
        'standalone': true
      },
      doctype: null,
      renderOpts: {
        'pretty': true,
        'indent': '  ',
        'newline': '\n'
      }
    }
  };

  exports.ValidationError = (function(_super) {
    __extends(ValidationError, _super);

    function ValidationError(message) {
      this.message = message;
    }

    return ValidationError;

  })(Error);

  exports.Builder = (function() {
    function Builder(opts) {
      var key, value, _ref;
      this.options = {};
      _ref = exports.defaults["0.2"];
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        this.options[key] = value;
      }
      for (key in opts) {
        if (!__hasProp.call(opts, key)) continue;
        value = opts[key];
        this.options[key] = value;
      }
    }

    Builder.prototype.buildObject = function(rootObj) {
      var attrkey, charkey, render, rootElement, rootName;
      attrkey = this.options.attrkey;
      charkey = this.options.charkey;
      if ((Object.keys(rootObj).length === 1) && (this.options.rootName === exports.defaults['0.2'].rootName)) {
        rootName = Object.keys(rootObj)[0];
        rootObj = rootObj[rootName];
      } else {
        rootName = this.options.rootName;
      }
      render = function(element, obj) {
        var attr, child, entry, index, key, value, _ref, _ref1;
        if (typeof obj !== 'object') {
          element.txt(obj);
        } else {
          for (key in obj) {
            if (!__hasProp.call(obj, key)) continue;
            child = obj[key];
            if (key === attrkey) {
              if (typeof child === "object") {
                for (attr in child) {
                  value = child[attr];
                  element = element.att(attr, value);
                }
              }
            } else if (key === charkey) {
              element = element.txt(child);
            } else if (typeof child === 'object' && ((child != null ? child.constructor : void 0) != null) && ((child != null ? (_ref = child.constructor) != null ? _ref.name : void 0 : void 0) != null) && (child != null ? (_ref1 = child.constructor) != null ? _ref1.name : void 0 : void 0) === 'Array') {
              for (index in child) {
                if (!__hasProp.call(child, index)) continue;
                entry = child[index];
                if (typeof entry === 'string') {
                  element = element.ele(key, entry).up();
                } else {
                  element = arguments.callee(element.ele(key), entry).up();
                }
              }
            } else if (typeof child === "object") {
              element = arguments.callee(element.ele(key), child).up();
            } else {
              element = element.ele(key, child.toString()).up();
            }
          }
        }
        return element;
      };
      rootElement = builder.create(rootName, this.options.xmldec, this.options.doctype);
      return render(rootElement, rootObj).end(this.options.renderOpts);
    };

    return Builder;

  })();

  exports.Parser = (function(_super) {
    __extends(Parser, _super);

    function Parser(opts) {
      this.parseString = __bind(this.parseString, this);
      this.reset = __bind(this.reset, this);
      this.assignOrPush = __bind(this.assignOrPush, this);
      var key, value, _ref;
      if (!(this instanceof exports.Parser)) {
        return new exports.Parser(opts);
      }
      this.options = {};
      _ref = exports.defaults["0.2"];
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        this.options[key] = value;
      }
      for (key in opts) {
        if (!__hasProp.call(opts, key)) continue;
        value = opts[key];
        this.options[key] = value;
      }
      if (this.options.xmlns) {
        this.options.xmlnskey = this.options.attrkey + "ns";
      }
      this.reset();
    }

    Parser.prototype.assignOrPush = function(obj, key, newValue) {
      if (!(key in obj)) {
        if (!this.options.explicitArray) {
          return obj[key] = newValue;
        } else {
          return obj[key] = [newValue];
        }
      } else {
        if (!(obj[key] instanceof Array)) {
          obj[key] = [obj[key]];
        }
        return obj[key].push(newValue);
      }
    };

    Parser.prototype.reset = function() {
      var attrkey, charkey, err, ontext, stack,
        _this = this;
      this.removeAllListeners();
      this.saxParser = sax.parser(this.options.strict, {
        trim: false,
        normalize: false,
        xmlns: this.options.xmlns
      });
      err = false;
      this.saxParser.onerror = function(error) {
        if (!err) {
          err = true;
          return _this.emit("error", error);
        }
      };
      this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
      this.resultObject = null;
      stack = [];
      attrkey = this.options.attrkey;
      charkey = this.options.charkey;
      this.saxParser.onopentag = function(node) {
        var key, newValue, obj, _ref;
        obj = {};
        obj[charkey] = "";
        if (!_this.options.ignoreAttrs) {
          _ref = node.attributes;
          for (key in _ref) {
            if (!__hasProp.call(_ref, key)) continue;
            if (!(attrkey in obj) && !_this.options.mergeAttrs) {
              obj[attrkey] = {};
            }
            newValue = node.attributes[key];
            if (_this.options.mergeAttrs) {
              _this.assignOrPush(obj, key, newValue);
            } else {
              obj[attrkey][key] = newValue;
            }
          }
        }
        obj["#name"] = _this.options.normalizeTags ? node.name.toLowerCase() : node.name;
        if (_this.options.xmlns) {
          obj[_this.options.xmlnskey] = {
            uri: node.uri,
            local: node.local
          };
        }
        return stack.push(obj);
      };
      this.saxParser.onclosetag = function() {
        var cdata, emptyStr, node, nodeName, obj, old, s, xpath;
        obj = stack.pop();
        nodeName = obj["#name"];
        delete obj["#name"];
        cdata = obj.cdata;
        delete obj.cdata;
        s = stack[stack.length - 1];
        if (obj[charkey].match(/^\s*$/) && !cdata) {
          emptyStr = obj[charkey];
          delete obj[charkey];
        } else {
          if (_this.options.trim) {
            obj[charkey] = obj[charkey].trim();
          }
          if (_this.options.normalize) {
            obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
          }
          if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
            obj = obj[charkey];
          }
        }
        if (isEmpty(obj)) {
          obj = _this.options.emptyTag !== void 0 ? _this.options.emptyTag : emptyStr;
        }
        if (_this.options.validator != null) {
          xpath = "/" + ((function() {
                                        var _i, _len, _
                                        
                                        ;
            _results = [];
            for (_i = 0, _len = stack.length; _i < _len; _i++) {
              node = stack[_i];
              _results.push(node["#name"]);
            }
            return _results;
          })()).concat(nodeName).join("/");
          try {
            obj = _this.options.validator(xpath, s && s[nodeName], obj);
          } catch (_error) {
            err = _error;
            _this.emit("error", err);
          }
        }
        if (_this.options.explicitChildren && !_this.options.mergeAttrs && typeof obj === 'object') {
          node = {};
          if (_this.options.attrkey in obj) {
            node[_this.options.attrkey] = obj[_this.options.attrkey];
            delete obj[_this.options.attrkey];
          }
          if (!_this.options.charsAsChildren && _this.options.charkey in obj) {
            node[_this.options.charkey] = obj[_this.options.charkey];
            delete obj[_this.options.charkey];
          }
          if (Object.getOwnPropertyNames(obj).length > 0) {
            node[_this.options.childkey] = obj;
          }
          obj = node;
        }
        if (stack.length > 0) {
          return _this.assignOrPush(s, nodeName, obj);
        } else {
          if (_this.options.explicitRoot) {
            old = obj;
            obj = {};
            obj[nodeName] = old;
          }
          _this.resultObject = obj;
          return _this.emit("end", _this.resultObject);
        }
      };
      ontext = function(text) {
        var s;
        s = stack[stack.length - 1];
        if (s) {
          s[charkey] += text;
          return s;
        }
      };
      this.saxParser.ontext = ontext;
      return this.saxParser.oncdata = function(text) {
        var s;
        s = ontext(text);
        if (s) {
          return s.cdata = true;
        }
      };
    };

    Parser.prototype.parseString = function(str, cb) {
      if ((cb != null) && typeof cb === "function") {
        this.on("end", function(result) {
          this.reset();
          if (this.options.async) {
            return process.nextTick(function() {
              return cb(null, result);
            });
          } else {
            return cb(null, result);
          }
        });
        this.on("error", function(err) {
          this.reset();
          if (this.options.async) {
            return process.nextTick(function() {
              return cb(err);
            });
          } else {
            return cb(err);
          }
        });
      }
      if (str.toString().trim() === '') {
        this.emit("end", null);
        return true;
      }
      return this.saxParser.write(bom.stripBOM(str.toString()));
    };

    return Parser;

  })(events.EventEmitter);

  exports.parseString = function(str, a, b) {
    var cb, options, parser;
    if (b != null) {
      if (typeof b === 'function') {
        cb = b;
      }
      if (typeof a === 'object') {
        options = a;
      }
    } else {
      if (typeof a === 'function') {
        cb = a;
      }
      options = {};
    }
    parser = new exports.Parser(options);
    return parser.parseString(str, cb);
  };

}).call(this);

}).call(this,require('_process'))
},{"./bom":71,"_process":25,"events":21,"sax":73,"xmlbuilder":95}],73:[function(require,module,exports){
(function (Buffer){
// wrapper for non-node envs
;(function (sax) {

sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
sax.SAXParser = SAXParser
sax.SAXStream = SAXStream
sax.createStream = createStream

// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
// since that's the earliest that a buffer overrun could occur.  This way, checks are
// as rare as required, but as often as necessary to ensure never crossing this bound.
// Furthermore, buffers are only tested at most once per write(), so passing a very
// large string into write() might have undesirable effects, but this is manageable by
// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
// edge case, result in creating at most one complete copy of the string passed in.
// Set to Infinity to have unlimited buffers.
sax.MAX_BUFFER_LENGTH = 64 * 1024

var buffers = [
  "comment", "sgmlDecl", "textNode", "tagName", "doctype",
  "procInstName", "procInstBody", "entity", "attribName",
  "attribValue", "cdata", "script"
]

sax.EVENTS = // for discoverability.
  [ "text"
  , "processinginstruction"
  , "sgmldeclaration"
  , "doctype"
  , "comment"
  , "attribute"
  , "opentag"
  , "closetag"
  , "opencdata"
  , "cdata"
  , "closecdata"
  , "error"
  , "end"
  , "ready"
  , "script"
  , "opennamespace"
  , "closenamespace"
  ]

function SAXParser (strict, opt) {
  if (!(this instanceof SAXParser)) return new SAXParser(strict, opt)

  var parser = this
  clearBuffers(parser)
  parser.q = parser.c = ""
  parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
  parser.opt = opt || {}
  parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
  parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase"
  parser.tags = []
  parser.closed = parser.closedRoot = parser.sawRoot = false
  parser.tag = parser.error = null
  parser.strict = !!strict
  parser.noscript = !!(strict || parser.opt.noscript)
  parser.state = S.BEGIN
  parser.ENTITIES = Object.create(sax.ENTITIES)
  parser.attribList = []

  // namespaces form a prototype chain.
  // it always points at the current tag,
  // which protos to its parent tag.
  if (parser.opt.xmlns) parser.ns = Object.create(rootNS)

  // mostly just for error reporting
  parser.trackPosition = parser.opt.position !== false
  if (parser.trackPosition) {
    parser.position = parser.line = parser.column = 0
  }
  emit(parser, "onready")
}

if (!Object.create) Object.create = function (o) {
  function f () { this.__proto__ = o }
  f.prototype = o
  return new f
}

if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
  return o.__proto__
}

if (!Object.keys) Object.keys = function (o) {
  var a = []
  for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
  return a
}

function checkBufferLength (parser) {
  var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    , maxActual = 0
  for (var i = 0, l = buffers.length; i < l; i ++) {
    var len = parser[buffers[i]].length
    if (len > maxAllowed) {
      // Text/cdata nodes can get big, and since they're buffered,
      // we can get here under normal conditions.
      // Avoid issues by emitting the text node now,
      // so at least it won't get any bigger.
      switch (buffers[i]) {
        case "textNode":
          closeText(parser)
        break

        case "cdata":
          emitNode(parser, "oncdata", parser.cdata)
          parser.cdata = ""
        break

        case "script":
          emitNode(parser, "onscript", parser.script)
          parser.script = ""
        break

        default:
          error(parser, "Max buffer length exceeded: "+buffers[i])
      }
    }
    maxActual = Math.max(maxActual, len)
  }
  // schedule the next check for the earliest possible buffer overrun.
  parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
                             + parser.position
}

function clearBuffers (parser) {
  for (var i = 0, l = buffers.length; i < l; i ++) {
    parser[buffers[i]] = ""
  }
}

function flushBuffers (parser) {
  closeText(parser)
  if (parser.cdata !== "") {
    emitNode(parser, "oncdata", parser.cdata)
    parser.cdata = ""
  }
  if (parser.script !== "") {
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }
}

SAXParser.prototype =
  { end: function () { end(this) }
  , write: write
  , resume: function () { this.error = null; return this }
  , close: function () { return this.write(null) }
  , flush: function () { flushBuffers(this) }
  }

try {
  var Stream = require("stream").Stream
} catch (ex) {
  var Stream = function () {}
}


var streamWraps = sax.EVENTS.filter(function (ev) {
  return ev !== "error" && ev !== "end"
})

function createStream (strict, opt) {
  return new SAXStream(strict, opt)
}

function SAXStream (strict, opt) {
  if (!(this instanceof SAXStream)) return new SAXStream(strict, opt)

  Stream.apply(this)

  this._parser = new SAXParser(strict, opt)
  this.writable = true
  this.readable = true


  var me = this

  this._parser.onend = function () {
    me.emit("end")
  }

  this._parser.onerror = function (er) {
    me.emit("error", er)

    // if didn't throw, then means error was handled.
    // go ahead and clear error, so we can write again.
    me._parser.error = null
  }

  this._decoder = null;

  streamWraps.forEach(function (ev) {
    Object.defineProperty(me, "on" + ev, {
      get: function () { return me._parser["on" + ev] },
      set: function (h) {
        if (!h) {
          me.removeAllListeners(ev)
          return me._parser["on"+ev] = h
        }
        me.on(ev, h)
      },
      enumerable: true,
      configurable: false
    })
  })
}

SAXStream.prototype = Object.create(Stream.prototype,
  { constructor: { value: SAXStream } })

SAXStream.prototype.write = function (data) {
  if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
    if (!this._decoder) {
      var SD = require('string_decoder').StringDecoder
      this._decoder = new SD('utf8')
    }
    data = this._decoder.write(data);
  }

  this._parser.write(data.toString())
  this.emit("data", data)
  return true
}

SAXStream.prototype.end = function (chunk) {
  if (chunk && chunk.length) this.write(chunk)
  this._parser.end()
  return true
}

SAXStream.prototype.on = function (ev, handler) {
  var me = this
  if (!me._parser["on"+ev] && streamWraps.indexOf(ev) !== -1) {
    me._parser["on"+ev] = function () {
      var args = arguments.length === 1 ? [arguments[0]]
               : Array.apply(null, arguments)
      args.splice(0, 0, ev)
      me.emit.apply(me, args)
    }
  }

  return Stream.prototype.on.call(me, ev, handler)
}



// character classes and tokens
var whitespace = "\r\n\t "
  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  , number = "0124356789"
  , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  // (Letter | "_" | ":")
  , quote = "'\""
  , entity = number+letter+"#"
  , attribEnd = whitespace + ">"
  , CDATA = "[CDATA["
  , DOCTYPE = "DOCTYPE"
  , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
  , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
  , rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

// turn all the string character sets into character class objects.
whitespace = charClass(whitespace)
number = charClass(number)
letter = charClass(letter)

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/

quote = charClass(quote)
entity = charClass(entity)
attribEnd = charClass(attribEnd)

function charClass (str) {
  return str.split("").reduce(function (s, c) {
    s[c] = true
    return s
  }, {})
}

function isRegExp (c) {
  return Object.prototype.toString.call(c) === '[object RegExp]'
}

function is (charclass, c) {
  return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
}

function not (charclass, c) {
  return !is(charclass, c)
}

var S = 0
sax.STATE =
{ BEGIN                     : S++
, TEXT                      : S++ // general stuff
, TEXT_ENTITY               : S++ // &amp and such.
, OPEN_WAKA                 : S++ // <
, SGML_DECL                 : S++ // <!BLARG
, SGML_DECL_QUOTED          : S++ // <!BLARG foo "bar
, DOCTYPE                   : S++ // <!DOCTYPE
, DOCTYPE_QUOTED            : S++ // <!DOCTYPE "//blah
, DOCTYPE_DTD               : S++ // <!DOCTYPE "//blah" [ ...
, DOCTYPE_DTD_QUOTED        : S++ // <!DOCTYPE "//blah" [ "foo
, COMMENT_STARTING          : S++ // <!-
, COMMENT                   : S++ // <!--
, COMMENT_ENDING            : S++ // <!-- blah -
, COMMENT_ENDED             : S++ // <!-- blah --
, CDATA                     : S++ // <![CDATA[ something
, CDATA_ENDING              : S++ // ]
, CDATA_ENDING_2            : S++ // ]]
, PROC_INST                 : S++ // <?hi
, PROC_INST_BODY            : S++ // <?hi there
, PROC_INST_ENDING          : S++ // <?hi "there" ?
, OPEN_TAG                  : S++ // <strong
, OPEN_TAG_SLASH            : S++ // <strong /
, ATTRIB                    : S++ // <a
, ATTRIB_NAME               : S++ // <a foo
, ATTRIB_NAME_SAW_WHITE     : S++ // <a foo _
, ATTRIB_VALUE              : S++ // <a foo=
, ATTRIB_VALUE_QUOTED       : S++ // <a foo="bar
, ATTRIB_VALUE_CLOSED       : S++ // <a foo="bar"
, ATTRIB_VALUE_UNQUOTED     : S++ // <a foo=bar
, ATTRIB_VALUE_ENTITY_Q     : S++ // <foo bar="&quot;"
, ATTRIB_VALUE_ENTITY_U     : S++ // <foo bar=&quot;
, CLOSE_TAG                 : S++ // </a
, CLOSE_TAG_SAW_WHITE       : S++ // </a   >
, SCRIPT                    : S++ // <script> ...
, SCRIPT_ENDING             : S++ // <script> ... <
}

sax.ENTITIES =
{ "amp" : "&"
, "gt" : ">"
, "lt" : "<"
, "quot" : "\""
, "apos" : "'"
, "AElig" : 198
, "Aacute" : 193
, "Acirc" : 194
, "Agrave" : 192
, "Aring" : 197
, "Atilde" : 195
, "Auml" : 196
, "Ccedil" : 199
, "ETH" : 208
, "Eacute" : 201
, "Ecirc" : 202
, "Egrave" : 200
, "Euml" : 203
, "Iacute" : 205
, "Icirc" : 206
, "Igrave" : 204
, "Iuml" : 207
, "Ntilde" : 209
, "Oacute" : 211
, "Ocirc" : 212
, "Ograve" : 210
, "Oslash" : 216
, "Otilde" : 213
, "Ouml" : 214
, "THORN" : 222
, "Uacute" : 218
, "Ucirc" : 219
, "Ugrave" : 217
, "Uuml" : 220
, "Yacute" : 221
, "aacute" : 225
, "acirc" : 226
, "aelig" : 230
, "agrave" : 224
, "aring" : 229
, "atilde" : 227
, "auml" : 228
, "ccedil" : 231
, "eacute" : 233
, "ecirc" : 234
, "egrave" : 232
, "eth" : 240
, "euml" : 235
, "iacute" : 237
, "icirc" : 238
, "igrave" : 236
, "iuml" : 239
, "ntilde" : 241
, "oacute" : 243
, "ocirc" : 244
, "ograve" : 242
, "oslash" : 248
, "otilde" : 245
, "ouml" : 246
, "szlig" : 223
, "thorn" : 254
, "uacute" : 250
, "ucirc" : 251
, "ugrave" : 249
, "uuml" : 252
, "yacute" : 253
, "yuml" : 255
, "copy" : 169
, "reg" : 174
, "nbsp" : 160
, "iexcl" : 161
, "cent" : 162
, "pound" : 163
, "curren" : 164
, "yen" : 165
, "brvbar" : 166
, "sect" : 167
, "uml" : 168
, "ordf" : 170
, "laquo" : 171
, "not" : 172
, "shy" : 173
, "macr" : 175
, "deg" : 176
, "plusmn" : 177
, "sup1" : 185
, "sup2" : 178
, "sup3" : 179
, "acute" : 180
, "micro" : 181
, "para" : 182
, "middot" : 183
, "cedil" : 184
, "ordm" : 186
, "raquo" : 187
, "frac14" : 188
, "frac12" : 189
, "frac34" : 190
, "iquest" : 191
, "times" : 215
, "divide" : 247
, "OElig" : 338
, "oelig" : 339
, "Scaron" : 352
, "scaron" : 353
, "Yuml" : 376
, "fnof" : 402
, "circ" : 710
, "tilde" : 732
, "Alpha" : 913
, "Beta" : 914
, "Gamma" : 915
, "Delta" : 916
, "Epsilon" : 917
, "Zeta" : 918
, "Eta" : 919
, "Theta" : 920
, "Iota" : 921
, "Kappa" : 922
, "Lambda" : 923
, "Mu" : 924
, "Nu" : 925
, "Xi" : 926
, "Omicron" : 927
, "Pi" : 928
, "Rho" : 929
, "Sigma" : 931
, "Tau" : 932
, "Upsilon" : 933
, "Phi" : 934
, "Chi" : 935
, "Psi" : 936
, "Omega" : 937
, "alpha" : 945
, "beta" : 946
, "gamma" : 947
, "delta" : 948
, "epsilon" : 949
, "zeta" : 950
, "eta" : 951
, "theta" : 952
, "iota" : 953
, "kappa" : 954
, "lambda" : 955
, "mu" : 956
, "nu" : 957
, "xi" : 958
, "omicron" : 959
, "pi" : 960
, "rho" : 961
, "sigmaf" : 962
, "sigma" : 963
, "tau" : 964
, "upsilon" : 965
, "phi" : 966
, "chi" : 967
, "psi" : 968
, "omega" : 969
, "thetasym" : 977
, "upsih" : 978
, "piv" : 982
, "ensp" : 8194
, "emsp" : 8195
, "thinsp" : 8201
, "zwnj" : 8204
, "zwj" : 8205
, "lrm" : 8206
, "rlm" : 8207
, "ndash" : 8211
, "mdash" : 8212
, "lsquo" : 8216
, "rsquo" : 8217
, "sbquo" : 8218
, "ldquo" : 8220
, "rdquo" : 8221
, "bdquo" : 8222
, "dagger" : 8224
, "Dagger" : 8225
, "bull" : 8226
, "hellip" : 8230
, "permil" : 8240
, "prime" : 8242
, "Prime" : 8243
, "lsaquo" : 8249
, "rsaquo" : 8250
, "oline" : 8254
, "frasl" : 8260
, "euro" : 8364
, "image" : 8465
, "weierp" : 8472
, "real" : 8476
, "trade" : 8482
, "alefsym" : 8501
, "larr" : 8592
, "uarr" : 8593
, "rarr" : 8594
, "darr" : 8595
, "harr" : 8596
, "crarr" : 8629
, "lArr" : 8656
, "uArr" : 8657
, "rArr" : 8658
, "dArr" : 8659
, "hArr" : 8660
, "forall" : 8704
, "part" : 8706
, "exist" : 8707
, "empty" : 8709
, "nabla" : 8711
, "isin" : 8712
, "notin" : 8713
, "ni" : 8715
, "prod" : 8719
, "sum" : 8721
, "minus" : 8722
, "lowast" : 8727
, "radic" : 8730
, "prop" : 8733
, "infin" : 8734
, "ang" : 8736
, "and" : 8743
, "or" : 8744
, "cap" : 8745
, "cup" : 8746
, "int" : 8747
, "there4" : 8756
, "sim" : 8764
, "cong" : 8773
, "asymp" : 8776
, "ne" : 8800
, "equiv" : 8801
, "le" : 8804
, "ge" : 8805
, "sub" : 8834
, "sup" : 8835
, "nsub" : 8836
, "sube" : 8838
, "supe" : 8839
, "oplus" : 8853
, "otimes" : 8855
, "perp" : 8869
, "sdot" : 8901
, "lceil" : 8968
, "rceil" : 8969
, "lfloor" : 8970
, "rfloor" : 8971
, "lang" : 9001
, "rang" : 9002
, "loz" : 9674
, "spades" : 9824
, "clubs" : 9827
, "hearts" : 9829
, "diams" : 9830
}

Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
})

for (var S in sax.STATE) sax.STATE[sax.STATE[S]] = S

// shorthand
S = sax.STATE

function emit (parser, event, data) {
  parser[event] && parser[event](data)
}

function emitNode (parser, nodeType, data) {
  if (parser.textNode) closeText(parser)
  emit(parser, nodeType, data)
}

function closeText (parser) {
  parser.textNode = textopts(parser.opt, parser.textNode)
  if (parser.textNode) emit(parser, "ontext", parser.textNode)
  parser.textNode = ""
}

function textopts (opt, text) {
  if (opt.trim) text = text.trim()
  if (opt.normalize) text = text.replace(/\s+/g, " ")
  return text
}

function error (parser, er) {
  closeText(parser)
  if (parser.trackPosition) {
    er += "\nLine: "+parser.line+
          "\nColumn: "+parser.column+
          "\nChar: "+parser.c
  }
  er = new Error(er)
  parser.error = er
  emit(parser, "onerror", er)
  return parser
}

function end (parser) {
  if (!parser.closedRoot) strictFail(parser, "Unclosed root tag")
  if ((parser.state !== S.BEGIN) && (parser.state !== S.TEXT)) error(parser, "Unexpected end")
  closeText(parser)
  parser.c = ""
  parser.closed = true
  emit(parser, "onend")
  SAXParser.call(parser, parser.strict, parser.opt)
  return parser
}

function strictFail (parser, message) {
  if (typeof parser !== 'object' || !(parser instanceof SAXParser))
    throw new Error('bad call to strictFail');
  if (parser.strict) error(parser, message)
}

function newTag (parser) {
  if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
  var parent = parser.tags[parser.tags.length - 1] || parser
    , tag = parser.tag = { name : parser.tagName, attributes : {} }

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (parser.opt.xmlns) tag.ns = parent.ns
  parser.attribList.length = 0
}

function qname (name, attribute) {
  var i = name.indexOf(":")
    , qualName = i < 0 ? [ "", name ] : name.split(":")
    , prefix = qualName[0]
    , local = qualName[1]

  // <x "xmlns"="http://foo">
  if (attribute && name === "xmlns") {
    prefix = "xmlns"
    local = ""
  }

  return { prefix: prefix, local: local }
}

function attrib (parser) {
  if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]()

  if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
    return parser.attribName = parser.attribValue = ""
  }

  if (parser.opt.xmlns) {
    var qn = qname(parser.attribName, true)
      , prefix = qn.prefix
      , local = qn.local

    if (prefix === "xmlns") {
      // namespace binding attribute; push the binding into scope
      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
        strictFail( parser
                  , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
        strictFail( parser
                  , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else {
        var tag = parser.tag
          , parent = parser.tags[parser.tags.length - 1] || parser
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns)
        }
        tag.ns[local] = parser.attribValue
      }
    }

    // defer onattribute events until all attributes have been seen
    // so any new bindings can take effect; preserve attribute order
    // so deferred events can be emitted in document order
    parser.attribList.push([parser.attribName, parser.attribValue])
  } else {
    // in non-xmlns mode, we can emit the event right away
    parser.tag.attributes[parser.attribName] = parser.attribValue
    emitNode( parser
            , "onattribute"
            , { name: parser.attribName
              , value: parser.attribValue } )
  }

  parser.attribName = parser.attribValue = ""
}

function openTag (parser, selfClosing) {
  if (parser.opt.xmlns) {
    // emit namespace binding events
    var tag = parser.tag

    // add namespace info to tag
    var qn = qname(parser.tagName)
    tag.prefix = qn.prefix
    tag.local = qn.local
    tag.uri = tag.ns[qn.prefix] || ""

    if (tag.prefix && !tag.uri) {
      strictFail(parser, "Unbound namespace prefix: "
                       + JSON.stringify(parser.tagName))
      tag.uri = qn.prefix
    }

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (tag.ns && parent.ns !== tag.ns) {
      Object.keys(tag.ns).forEach(function (p) {
        emitNode( parser
                , "onopennamespace"
                , { prefix: p , uri: tag.ns[p] } )
      })
    }

    // handle deferred onattribute events
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (var i = 0, l = parser.attribList.length; i < l; i ++) {
      var nv = parser.attribList[i]
      var name = nv[0]
        , value = nv[1]
        , qualName = qname(name, true)
        , prefix = qualName.prefix
        , local = qualName.local
        , uri = prefix == "" ? "" : (tag.ns[prefix] || "")
        , a = { name: name
              , value: value
              , prefix: prefix
              , local: local
              , uri: uri
              }

      // if there's any attributes with an undefined namespace,
      // then fail on them now.
      if (prefix && prefix != "xmlns" && !uri) {
        strictFail(parser, "Unbound namespace prefix: "
                         + JSON.stringify(prefix))
        a.uri = prefix
      }
      parser.tag.attributes[name] = a
      emitNode(parser, "onattribute", a)
    }
    parser.attribList.length = 0
  }

  parser.tag.isSelfClosing = !!selfClosing

  // process the tag
  parser.sawRoot = true
  parser.tags.push(parser.tag)
  emitNode(parser, "onopentag", parser.tag)
  if (!selfClosing) {
    // special case for <script> in non-strict mode.
    if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
      parser.state = S.SCRIPT
    } else {
      parser.state = S.TEXT
    }
    parser.tag = null
    parser.tagName = ""
  }
  parser.attribName = parser.attribValue = ""
  parser.attribList.length = 0
}

function closeTag (parser) {
  if (!parser.tagName) {
    strictFail(parser, "Weird empty close tag.")
    parser.textNode += "</>"
    parser.state = S.TEXT
    return
  }

  if (parser.script) {
    if (parser.tagName !== "script") {
      parser.script += "</" + parser.tagName + ">"
      parser.tagName = ""
      parser.state = S.SCRIPT
      return
    }
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  var t = parser.tags.length
  var tagName = parser.tagName
  if (!parser.strict) tagName = tagName[parser.looseCase]()
  var closeTo = tagName
  while (t --) {
    var close = parser.tags[t]
    if (close.name !== closeTo) {
      // fail the first time in strict mode
      strictFail(parser, "Unexpected close tag")
    } else break
  }

  // didn't find it.  we already failed for strict, so just abort.
  if (t < 0) {
    strictFail(parser, "Unmatched closing tag: "+parser.tagName)
    parser.textNode += "</" + parser.tagName + ">"
    parser.state = S.TEXT
    return
  }
  parser.tagName = tagName
  var s = parser.tags.length
  while (s --> t) {
    var tag = parser.tag = parser.tags.pop()
    parser.tagName = parser.tag.name
    emitNode(parser, "onclosetag", parser.tagName)

    var x = {}
    for (var i in tag.ns) x[i] = tag.ns[i]

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (parser.opt.xmlns && tag.ns !== parent.ns) {
      // remove namespace bindings introduced by tag
      Object.keys(tag.ns).forEach(function (p) {
        var n = tag.ns[p]
        emitNode(parser, "onclosenamespace", { prefix: p, uri: n })
      })
    }
  }
  if (t === 0) parser.closedRoot = true
  parser.tagName = parser.attribValue = parser.attribName = ""
  parser.attribList.length = 0
  parser.state = S.TEXT
}

function parseEntity (parser) {
  var entity = parser.entity
    , entityLC = entity.toLowerCase()
    , num
    , numStr = ""
  if (parser.ENTITIES[entity])
    return parser.ENTITIES[entity]
  if (parser.ENTITIES[entityLC])
    return parser.ENTITIES[entityLC]
  entity = entityLC
  if (entity.charAt(0) === "#") {
    if (entity.charAt(1) === "x") {
      entity = entity.slice(2)
      num = parseInt(entity, 16)
      numStr = num.toString(16)
    } else {
      entity = entity.slice(1)
      num = parseInt(entity, 10)
      numStr = num.toString(10)
    }
  }
  entity = entity.replace(/^0+/, "")
  if (numStr.toLowerCase() !== entity) {
    strictFail(parser, "Invalid character entity")
    return "&"+parser.entity + ";"
  }
  return String.fromCharCode(num)
}

function write (chunk) {
  var parser = this
  if (this.error) throw this.error
  if (parser.closed) return error(parser,
    "Cannot write after close. Assign an onready handler.")
  if (chunk === null) return end(parser)
  var i = 0, c = ""
  while (parser.c = c = chunk.charAt(i++)) {
    if (parser.trackPosition) {
      parser.position ++
      if (c === "\n") {
        parser.line ++
        parser.column = 0
      } else parser.column ++
    }
    switch (parser.state) {

      case S.BEGIN:
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else if (not(whitespace,c)) {
          // have to process this as a text node.
          // weird, but happens.
          strictFail(parser, "Non-whitespace before first tag.")
          parser.textNode = c
          parser.state = S.TEXT
        }
      continue

      case S.TEXT:
        if (parser.sawRoot && !parser.closedRoot) {
          var starti = i-1
          while (c && c!=="<" && c!=="&") {
            c = chunk.charAt(i++)
            if (c && parser.trackPosition) {
              parser.position ++
              if (c === "\n") {
                parser.line ++
                parser.column = 0
              } else parser.column ++
            }
          }
          parser.textNode += chunk.substring(starti, i-1)
        }
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else {
          if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
            strictFail(parser, "Text data outside of root node.")
          if (c === "&") parser.state = S.TEXT_ENTITY
          else parser.textNode += c
        }
      continue

      case S.SCRIPT:
        // only non-strict
        if (c === "<") {
          parser.state = S.SCRIPT_ENDING
        } else parser.script += c
      continue

      case S.SCRIPT_ENDING:
        if (c === "/") {
          parser.state = S.CLOSE_TAG
        } else {
          parser.script += "<" + c
          parser.state = S.SCRIPT
        }
      continue

      case S.OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === "!") {
          parser.state = S.SGML_DECL
          parser.sgmlDecl = ""
        } else if (is(whitespace, c)) {
          // wait for it...
        } else if (is(nameStart,c)) {
          parser.state = S.OPEN_TAG
          parser.tagName = c
        } else if (c === "/") {
          parser.state = S.CLOSE_TAG
          parser.tagName = ""
        } else if (c === "?") {
          parser.state = S.PROC_INST
          parser.procInstName = parser.procInstBody = ""
        } else {
          strictFail(parser, "Unencoded <")
          // if there was some whitespace, then add that in.
          if (parser.startTagPosition + 1 < parser.position) {
            var pad = parser.position - parser.startTagPosition
            c = new Array(pad).join(" ") + c
          }
          parser.textNode += "<" + c
          parser.state = S.TEXT
        }
      continue

      case S.SGML_DECL:
        if ((parser.sgmlDecl+c).toUpperCase() === CDATA) {
          emitNode(parser, "onopencdata")
          parser.state = S.CDATA
          parser.sgmlDecl = ""
          parser.cdata = ""
        } else if (parser.sgmlDecl+c === "--") {
          parser.state = S.COMMENT
          parser.comment = ""
          parser.sgmlDecl = ""
        } else if ((parser.sgmlDecl+c).toUpperCase() === DOCTYPE) {
          parser.state = S.DOCTYPE
          if (parser.doctype || parser.sawRoot) strictFail(parser,
            "Inappropriately located doctype declaration")
          parser.doctype = ""
          parser.sgmlDecl = ""
        } else if (c === ">") {
          emitNode(parser, "onsgmldeclaration", parser.sgmlDecl)
          parser.sgmlDecl = ""
          parser.state = S.TEXT
        } else if (is(quote, c)) {
          parser.state = S.SGML_DECL_QUOTED
          parser.sgmlDecl += c
        } else parser.sgmlDecl += c
      continue

      case S.SGML_DECL_QUOTED:
        if (c === parser.q) {
          parser.state = S.SGML_DECL
          parser.q = ""
        }
        parser.sgmlDecl += c
      continue

      case S.DOCTYPE:
        if (c === ">") {
          parser.state = S.TEXT
          emitNode(parser, "ondoctype", parser.doctype)
          parser.doctype = true // just remember that we saw it.
        } else {
          parser.doctype += c
          if (c === "[") parser.state = S.DOCTYPE_DTD
          else if (is(quote, c)) {
            parser.state = S.DOCTYPE_QUOTED
            parser.q = c
          }
        }
      continue

      case S.DOCTYPE_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.q = ""
          parser.state = S.DOCTYPE
        }
      continue

      case S.DOCTYPE_DTD:
        parser.doctype += c
        if (c === "]") parser.state = S.DOCTYPE
        else if (is(quote,c)) {
          parser.state = S.DOCTYPE_DTD_QUOTED
          parser.q = c
        }
      continue

      case S.DOCTYPE_DTD_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.state = S.DOCTYPE_DTD
          parser.q = ""
        }
      continue

      case S.COMMENT:
        if (c === "-") parser.state = S.COMMENT_ENDING
        else parser.comment += c
      continue

      case S.COMMENT_ENDING:
        if (c === "-") {
          parser.state = S.COMMENT_ENDED
          parser.comment = textopts(parser.opt, parser.comment)
          if (parser.comment) emitNode(parser, "oncomment", parser.comment)
          parser.comment = ""
        } else {
          parser.comment += "-" + c
          parser.state = S.COMMENT
        }
      continue

      case S.COMMENT_ENDED:
        if (c !== ">") {
          strictFail(parser, "Malformed comment")
          // allow <!-- blah -- bloo --> in non-strict mode,
          // which is a comment of " blah -- bloo "
          parser.comment += "--" + c
          parser.state = S.COMMENT
        } else parser.state = S.TEXT
      continue

      case S.CDATA:
        if (c === "]") parser.state = S.CDATA_ENDING
        else parser.cdata += c
      continue

      case S.CDATA_ENDING:
        if (c === "]") parser.state = S.CDATA_ENDING_2
        else {
          parser.cdata += "]" + c
          parser.state = S.CDATA
        }
      continue

      case S.CDATA_ENDING_2:
        if (c === ">") {
          if (parser.cdata) emitNode(parser, "oncdata", parser.cdata)
          emitNode(parser, "onclosecdata")
          parser.cdata = ""
          parser.state = S.TEXT
        } else if (c === "]") {
          parser.cdata += "]"
        } else {
          parser.cdata += "]]" + c
          parser.state = S.CDATA
        }
      continue

      case S.PROC_INST:
        if (c === "?") parser.state = S.PROC_INST_ENDING
        else if (is(whitespace, c)) parser.state = S.PROC_INST_BODY
        else parser.procInstName += c
      continue

      case S.PROC_INST_BODY:
        if (!parser.procInstBody && is(whitespace, c)) continue
        else if (c === "?") parser.state = S.PROC_INST_ENDING
        else parser.procInstBody += c
      continue

      case S.PROC_INST_ENDING:
        if (c === ">") {
          emitNode(parser, "onprocessinginstruction", {
            name : parser.procInstName,
            body : parser.procInstBody
          })
          parser.procInstName = parser.procInstBody = ""
          parser.state = S.TEXT
        } else {
          parser.procInstBody += "?" + c
          parser.state = S.PROC_INST_BODY
        }
      continue

      case S.OPEN_TAG:
        if (is(nameBody, c)) parser.tagName += c
        else {
          newTag(parser)
          if (c === ">") openTag(parser)
          else if (c === "/") parser.state = S.OPEN_TAG_SLASH
          else {
            if (not(whitespace, c)) strictFail(
              parser, "Invalid character in tag name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.OPEN_TAG_SLASH:
        if (c === ">") {
          openTag(parser, true)
          closeTag(parser)
        } else {
          strictFail(parser, "Forward-slash in opening tag not followed by >")
          parser.state = S.ATTRIB
        }
      continue

      case S.ATTRIB:
        // haven't read the attribute name yet.
        if (is(whitespace, c)) continue
        else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (c === ">") {
          strictFail(parser, "Attribute without value")
          parser.attribValue = parser.attribName
          attrib(parser)
          openTag(parser)
        }
        else if (is(whitespace, c)) parser.state = S.ATTRIB_NAME_SAW_WHITE
        else if (is(nameBody, c)) parser.attribName += c
        else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME_SAW_WHITE:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (is(whitespace, c)) continue
        else {
          strictFail(parser, "Attribute without value")
          parser.tag.attributes[parser.attribName] = ""
          parser.attribValue = ""
          emitNode(parser, "onattribute",
                   { name : parser.attribName, value : "" })
          parser.attribName = ""
          if (c === ">") openTag(parser)
          else if (is(nameStart, c)) {
            parser.attribName = c
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, "Invalid attribute name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.ATTRIB_VALUE:
        if (is(whitespace, c)) continue
        else if (is(quote, c)) {
          parser.q = c
          parser.state = S.ATTRIB_VALUE_QUOTED
        } else {
          strictFail(parser, "Unquoted attribute value")
          parser.state = S.ATTRIB_VALUE_UNQUOTED
          parser.attribValue = c
        }
      continue

      case S.ATTRIB_VALUE_QUOTED:
        if (c !== parser.q) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        parser.q = ""
        parser.state = S.ATTRIB_VALUE_CLOSED
      continue

      case S.ATTRIB_VALUE_CLOSED:
        if (is(whitespace, c)) {
          parser.state = S.ATTRIB
        } else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          strictFail(parser, "No whitespace between attributes")
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_VALUE_UNQUOTED:
        if (not(attribEnd,c)) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        if (c === ">") openTag(parser)
        else parser.state = S.ATTRIB
      continue

      case S.CLOSE_TAG:
        if (!parser.tagName) {
          if (is(whitespace, c)) continue
          else if (not(nameStart, c)) {
            if (parser.script) {
              parser.script += "</" + c
              parser.state = S.SCRIPT
            } else {
              strictFail(parser, "Invalid tagname in closing tag.")
            }
          } else parser.tagName = c
        }
        else if (c === ">") closeTag(parser)
        else if (is(nameBody, c)) parser.tagName += c
        else if (parser.script) {
          parser.script += "</" + parser.tagName
          parser.tagName = ""
          parser.state = S.SCRIPT
        } else {
          if (not(whitespace, c)) strictFail(parser,
            "Invalid tagname in closing tag")
          parser.state = S.CLOSE_TAG_SAW_WHITE
        }
      continue

      case S.CLOSE_TAG_SAW_WHITE:
        if (is(whitespace, c)) continue
        if (c === ">") closeTag(parser)
        else strictFail(parser, "Invalid characters in closing tag")
      continue

      case S.TEXT_ENTITY:
      case S.ATTRIB_VALUE_ENTITY_Q:
      case S.ATTRIB_VALUE_ENTITY_U:
        switch(parser.state) {
          case S.TEXT_ENTITY:
            var returnState = S.TEXT, buffer = "textNode"
          break

          case S.ATTRIB_VALUE_ENTITY_Q:
            var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue"
          break

          case S.ATTRIB_VALUE_ENTITY_U:
            var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue"
          break
        }
        if (c === ";") {
          parser[buffer] += parseEntity(parser)
          parser.entity = ""
          parser.state = returnState
        }
        else if (is(entity, c)) parser.entity += c
        else {
          strictFail(parser, "Invalid character entity")
          parser[buffer] += "&" + parser.entity + c
          parser.entity = ""
          parser.state = returnState
        }
      continue

      default:
        throw new Error(parser, "Unknown state: " + parser.state)
    }
  } // while
  // cdata blocks can get very big under normal conditions. emit and move on.
  // if (parser.state === S.CDATA && parser.cdata) {
  //   emitNode(parser, "oncdata", parser.cdata)
  //   parser.cdata = ""
  // }
  if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser)
  return parser
}

})(typeof exports === "undefined" ? sax = {} : exports)

}).call(this,require("buffer").Buffer)
},{"buffer":17,"stream":45,"string_decoder":52}],74:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var assign, camelCase, capitalize, isArray, isEmpty, isFunction, isObject, isPlainObject, kebabCase, snakeCase, titleCase, words,
    slice = [].slice,
    hasProp = {}.hasOwnProperty;

  assign = function() {
    var i, key, len, source, sources, target;
    target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    if (isFunction(Object.assign)) {
      Object.assign.apply(null, arguments);
    } else {
      for (i = 0, len = sources.length; i < len; i++) {
        source = sources[i];
        if (source != null) {
          for (key in source) {
            if (!hasProp.call(source, key)) continue;
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };

  isFunction = function(val) {
    return !!val && Object.prototype.toString.call(val) === '[object Function]';
  };

  isObject = function(val) {
    var ref;
    return !!val && ((ref = typeof val) === 'function' || ref === 'object');
  };

  isArray = function(val) {
    if (isFunction(Array.isArray)) {
      return Array.isArray(val);
    } else {
      return Object.prototype.toString.call(val) === '[object Array]';
    }
  };

  isEmpty = function(val) {
    var key;
    if (isArray(val)) {
      return !val.length;
    } else {
      for (key in val) {
        if (!hasProp.call(val, key)) continue;
        return false;
      }
      return true;
    }
  };

  isPlainObject = function(val) {
    var ctor, proto;
    return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && (typeof ctor === 'function') && (ctor instanceof ctor) && (Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object));
  };

  words = function(val) {
    return (val.split(/[-_\s]+|(?=[A-Z][a-z])/) || []).filter(function(n) {
      return !!n;
    });
  };

  camelCase = function(val) {
    var i, index, len, r, ref, word;
    r = '';
    ref = words(val);
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      word = ref[index];
      r += index ? capitalize(word.toLowerCase()) : word.toLowerCase();
    }
    return r;
  };

  titleCase = function(val) {
    var i, index, len, r, ref, word;
    r = '';
    ref = words(val);
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      word = ref[index];
      r += capitalize(word.toLowerCase());
    }
    return r;
  };

  kebabCase = function(val) {
    var i, index, len, r, ref, word;
    r = '';
    ref = words(val);
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      word = ref[index];
      r += (index ? '-' : '') + word.toLowerCase();
    }
    return r;
  };

  snakeCase = function(val) {
    var i, index, len, r, ref, word;
    r = '';
    ref = words(val);
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      word = ref[index];
      r += (index ? '_' : '') + word.toLowerCase();
    }
    return r;
  };

  capitalize = function(val) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  module.exports.assign = assign;

  module.exports.isFunction = isFunction;

  module.exports.isObject = isObject;

  module.exports.isArray = isArray;

  module.exports.isEmpty = isEmpty;

  module.exports.isPlainObject = isPlainObject;

  module.exports.camelCase = camelCase;

  module.exports.titleCase = titleCase;

  module.exports.kebabCase = kebabCase;

  module.exports.snakeCase = snakeCase;

  module.exports.capitalize = capitalize;

  module.exports.words = words;

}).call(this);

},{}],75:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLAttribute;

  module.exports = XMLAttribute = (function() {
    function XMLAttribute(parent, name, value) {
      this.options = parent.options;
      this.stringify = parent.stringify;
      if (name == null) {
        throw new Error("Missing attribute name of element " + parent.name);
      }
      if (value == null) {
        throw new Error("Missing attribute value for attribute " + name + " of element " + parent.name);
      }
      this.name = this.stringify.attName(name);
      this.value = this.stringify.attValue(value);
    }

    XMLAttribute.prototype.clone = function() {
      return Object.create(this);
    };

    XMLAttribute.prototype.toString = function(options) {
      return this.options.writer.set(options).attribute(this);
    };

    return XMLAttribute;

  })();

}).call(this);

},{}],76:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLCData, XMLNode,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLCData = (function(superClass) {
    extend(XMLCData, superClass);

    function XMLCData(parent, text) {
      XMLCData.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing CDATA text");
      }
      this.text = this.stringify.cdata(text);
    }

    XMLCData.prototype.clone = function() {
      return Object.create(this);
    };

    XMLCData.prototype.toString = function(options) {
      return this.options.writer.set(options).cdata(this);
    };

    return XMLCData;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],77:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLComment, XMLNode,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLComment = (function(superClass) {
    extend(XMLComment, superClass);

    function XMLComment(parent, text) {
      XMLComment.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing comment text");
      }
      this.text = this.stringify.comment(text);
    }

    XMLComment.prototype.clone = function() {
      return Object.create(this);
    };

    XMLComment.prototype.toString = function(options) {
      return this.options.writer.set(options).comment(this);
    };

    return XMLComment;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],78:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDTDAttList, XMLNode,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLDTDAttList = (function(superClass) {
    extend(XMLDTDAttList, superClass);

    function XMLDTDAttList(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      XMLDTDAttList.__super__.constructor.call(this, parent);
      if (elementName == null) {
        throw new Error("Missing DTD element name");
      }
      if (attributeName == null) {
        throw new Error("Missing DTD attribute name");
      }
      if (!attributeType) {
        throw new Error("Missing DTD attribute type");
      }
      if (!defaultValueType) {
        throw new Error("Missing DTD attribute default");
      }
      if (defaultValueType.indexOf('#') !== 0) {
        defaultValueType = '#' + defaultValueType;
      }
      if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
        throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT");
      }
      if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
        throw new Error("Default value only applies to #FIXED or #DEFAULT");
      }
      this.elementName = this.stringify.eleName(elementName);
      this.attributeName = this.stringify.attName(attributeName);
      this.attributeType = this.stringify.dtdAttType(attributeType);
      this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
      this.defaultValueType = defaultValueType;
    }

    XMLDTDAttList.prototype.toString = function(options) {
      return this.options.writer.set(options).dtdAttList(this);
    };

    return XMLDTDAttList;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],79:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDTDElement, XMLNode,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLDTDElement = (function(superClass) {
    extend(XMLDTDElement, superClass);

    function XMLDTDElement(parent, name, value) {
      XMLDTDElement.__super__.constructor.call(this, parent);
      if (name == null) {
        throw new Error("Missing DTD element name");
      }
      if (!value) {
        value = '(#PCDATA)';
      }
      if (Array.isArray(value)) {
        value = '(' + value.join(',') + ')';
      }
      this.name = this.stringify.eleName(name);
      this.value = this.stringify.dtdElementValue(value);
    }

    XMLDTDElement.prototype.toString = function(options) {
      return this.options.writer.set(options).dtdElement(this);
    };

    return XMLDTDElement;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],80:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDTDEntity, XMLNode, isObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  isObject = require('./Utility').isObject;

  XMLNode = require('./XMLNode');

  module.exports = XMLDTDEntity = (function(superClass) {
    extend(XMLDTDEntity, superClass);

    function XMLDTDEntity(parent, pe, name, value) {
      XMLDTDEntity.__super__.constructor.call(this, parent);
      if (name == null) {
        throw new Error("Missing entity name");
      }
      if (value == null) {
        throw new Error("Missing entity value");
      }
      this.pe = !!pe;
      this.name = this.stringify.eleName(name);
      if (!isObject(value)) {
        this.value = this.stringify.dtdEntityValue(value);
      } else {
        if (!value.pubID && !value.sysID) {
          throw new Error("Public and/or system identifiers are required for an external entity");
        }
        if (value.pubID && !value.sysID) {
          throw new Error("System identifier is required for a public external entity");
        }
        if (value.pubID != null) {
          this.pubID = this.stringify.dtdPubID(value.pubID);
        }
        if (value.sysID != null) {
          this.sysID = this.stringify.dtdSysID(value.sysID);
        }
        if (value.nData != null) {
          this.nData = this.stringify.dtdNData(value.nData);
        }
        if (this.pe && this.nData) {
          throw new Error("Notation declaration is not allowed in a parameter entity");
        }
      }
    }

    XMLDTDEntity.prototype.toString = function(options) {
      return this.options.writer.set(options).dtdEntity(this);
    };

    return XMLDTDEntity;

  })(XMLNode);

}).call(this);

},{"./Utility":74,"./XMLNode":87}],81:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDTDNotation, XMLNode,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLDTDNotation = (function(superClass) {
    extend(XMLDTDNotation, superClass);

    function XMLDTDNotation(parent, name, value) {
      XMLDTDNotation.__super__.constructor.call(this, parent);
      if (name == null) {
        throw new Error("Missing notation name");
      }
      if (!value.pubID && !value.sysID) {
        throw new Error("Public or system identifiers are required for an external entity");
      }
      this.name = this.stringify.eleName(name);
      if (value.pubID != null) {
        this.pubID = this.stringify.dtdPubID(value.pubID);
      }
      if (value.sysID != null) {
        this.sysID = this.stringify.dtdSysID(value.sysID);
      }
    }

    XMLDTDNotation.prototype.toString = function(options) {
      return this.options.writer.set(options).dtdNotation(this);
    };

    return XMLDTDNotation;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],82:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDeclaration, XMLNode, isObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  isObject = require('./Utility').isObject;

  XMLNode = require('./XMLNode');

  module.exports = XMLDeclaration = (function(superClass) {
    extend(XMLDeclaration, superClass);

    function XMLDeclaration(parent, version, encoding, standalone) {
      var ref;
      XMLDeclaration.__super__.constructor.call(this, parent);
      if (isObject(version)) {
        ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
      }
      if (!version) {
        version = '1.0';
      }
      this.version = this.stringify.xmlVersion(version);
      if (encoding != null) {
        this.encoding = this.stringify.xmlEncoding(encoding);
      }
      if (standalone != null) {
        this.standalone = this.stringify.xmlStandalone(standalone);
      }
    }

    XMLDeclaration.prototype.toString = function(options) {
      return this.options.writer.set(options).declaration(this);
    };

    return XMLDeclaration;

  })(XMLNode);

}).call(this);

},{"./Utility":74,"./XMLNode":87}],83:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLNode, isObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  isObject = require('./Utility').isObject;

  XMLNode = require('./XMLNode');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDNotation = require('./XMLDTDNotation');

  module.exports = XMLDocType = (function(superClass) {
    extend(XMLDocType, superClass);

    function XMLDocType(parent, pubID, sysID) {
      var ref, ref1;
      XMLDocType.__super__.constructor.call(this, parent);
      this.documentObject = parent;
      if (isObject(pubID)) {
        ref = pubID, pubID = ref.pubID, sysID = ref.sysID;
      }
      if (sysID == null) {
        ref1 = [pubID, sysID], sysID = ref1[0], pubID = ref1[1];
      }
      if (pubID != null) {
        this.pubID = this.stringify.dtdPubID(pubID);
      }
      if (sysID != null) {
        this.sysID = this.stringify.dtdSysID(sysID);
      }
    }

    XMLDocType.prototype.element = function(name, value) {
      var child;
      child = new XMLDTDElement(this, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      var child;
      child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.entity = function(name, value) {
      var child;
      child = new XMLDTDEntity(this, false, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.pEntity = function(name, value) {
      var child;
      child = new XMLDTDEntity(this, true, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.notation = function(name, value) {
      var child;
      child = new XMLDTDNotation(this, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.toString = function(options) {
      return this.options.writer.set(options).docType(this);
    };

    XMLDocType.prototype.ele = function(name, value) {
      return this.element(name, value);
    };

    XMLDocType.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
    };

    XMLDocType.prototype.ent = function(name, value) {
      return this.entity(name, value);
    };

    XMLDocType.prototype.pent = function(name, value) {
      return this.pEntity(name, value);
    };

    XMLDocType.prototype.not = function(name, value) {
      return this.notation(name, value);
    };

    XMLDocType.prototype.up = function() {
      return this.root() || this.documentObject;
    };

    return XMLDocType;

  })(XMLNode);

}).call(this);

},{"./Utility":74,"./XMLDTDAttList":78,"./XMLDTDElement":79,"./XMLDTDEntity":80,"./XMLDTDNotation":81,"./XMLNode":87}],84:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDocument, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  isPlainObject = require('./Utility').isPlainObject;

  XMLNode = require('./XMLNode');

  XMLStringifier = require('./XMLStringifier');

  XMLStringWriter = require('./XMLStringWriter');

  module.exports = XMLDocument = (function(superClass) {
    extend(XMLDocument, superClass);

    function XMLDocument(options) {
      XMLDocument.__super__.constructor.call(this, null);
      options || (options = {});
      if (!options.writer) {
        options.writer = new XMLStringWriter();
      }
      this.options = options;
      this.stringify = new XMLStringifier(options);
      this.isDocument = true;
    }

    XMLDocument.prototype.end = function(writer) {
      var writerOptions;
      if (!writer) {
        writer = this.options.writer;
      } else if (isPlainObject(writer)) {
        writerOptions = writer;
        writer = this.options.writer.set(writerOptions);
      }
      return writer.document(this);
    };

    XMLDocument.prototype.toString = function(options) {
      return this.options.writer.set(options).document(this);
    };

    return XMLDocument;

  })(XMLNode);

}).call(this);

},{"./Utility":74,"./XMLNode":87,"./XMLStringWriter":91,"./XMLStringifier":92}],85:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocumentCB, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, isFunction, isObject, isPlainObject, ref,
    hasProp = {}.hasOwnProperty;

  ref = require('./Utility'), isObject = ref.isObject, isFunction = ref.isFunction, isPlainObject = ref.isPlainObject;

  XMLElement = require('./XMLElement');

  XMLCData = require('./XMLCData');

  XMLComment = require('./XMLComment');

  XMLRaw = require('./XMLRaw');

  XMLText = require('./XMLText');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  XMLDeclaration = require('./XMLDeclaration');

  XMLDocType = require('./XMLDocType');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDNotation = require('./XMLDTDNotation');

  XMLAttribute = require('./XMLAttribute');

  XMLStringifier = require('./XMLStringifier');

  XMLStringWriter = require('./XMLStringWriter');

  module.exports = XMLDocumentCB = (function() {
    function XMLDocumentCB(options, onData, onEnd) {
      var writerOptions;
      options || (options = {});
      if (!options.writer) {
        options.writer = new XMLStringWriter(options);
      } else if (isPlainObject(options.writer)) {
        writerOptions = options.writer;
        options.writer = new XMLStringWriter(writerOptions);
      }
      this.options = options;
      this.writer = options.writer;
      this.stringify = new XMLStringifier(options);
      this.onDataCallback = onData || function() {};
      this.onEndCallback = onEnd || function() {};
      this.currentNode = null;
      this.currentLevel = -1;
      this.openTags = {};
      this.documentStarted = false;
      this.documentCompleted = false;
      this.root = null;
    }

    XMLDocumentCB.prototype.node = function(name, attributes, text) {
      var ref1;
      if (name == null) {
        throw new Error("Missing node name");
      }
      if (this.root && this.currentLevel === -1) {
        throw new Error("Document can only have one root node");
      }
      this.openCurrent();
      name = name.valueOf();
      if (attributes == null) {
        attributes = {};
      }
      attributes = attributes.valueOf();
      if (!isObject(attributes)) {
        ref1 = [attributes, text], text = ref1[0], attributes = ref1[1];
      }
      this.currentNode = new XMLElement(this, name, attributes);
      this.currentNode.children = false;
      this.currentLevel++;
      this.openTags[this.currentLevel] = this.currentNode;
      if (text != null) {
        this.text(text);
      }
      return this;
    };

    XMLDocumentCB.prototype.element = function(name, attributes, text) {
      if (this.currentNode && this.currentNode instanceof XMLDocType) {
        return this.dtdElement.apply(this, arguments);
      } else {
        return this.node(name, attributes, text);
      }
    };

    XMLDocumentCB.prototype.attribute = function(name, value) {
      var attName, attValue;
      if (!this.currentNode || this.currentNode.children) {
        throw new Error("att() can only be used immediately after an ele() call in callback mode");
      }
      if (name != null) {
        name = name.valueOf();
      }
      if (isObject(name)) {
        for (attName in name) {
          if (!hasProp.call(name, attName)) continue;
          attValue = name[attName];
          this.attribute(attName, attValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        if (!this.options.skipNullAttributes || (value != null)) {
          this.currentNode.attributes[name] = new XMLAttribute(this, name, value);
        }
      }
      return this;
    };

    XMLDocumentCB.prototype.text = function(value) {
      var node;
      this.openCurrent();
      node = new XMLText(this, value);
      this.onData(this.writer.text(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.cdata = function(value) {
      var node;
      this.openCurrent();
      node = new XMLCData(this, value);
      this.onData(this.writer.cdata(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.comment = function(value) {
      var node;
      this.openCurrent();
      node = new XMLComment(this, value);
      this.onData(this.writer.comment(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.raw = function(value) {
      var node;
      this.openCurrent();
      node = new XMLRaw(this, value);
      this.onData(this.writer.raw(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.instruction = function(target, value) {
      var i, insTarget, insValue, len, node;
      this.openCurrent();
      if (target != null) {
        target = target.valueOf();
      }
      if (value != null) {
        value = value.valueOf();
      }
      if (Array.isArray(target)) {
        for (i = 0, len = target.length; i < len; i++) {
          insTarget = target[i];
          this.instruction(insTarget);
        }
      } else if (isObject(target)) {
        for (insTarget in target) {
          if (!hasProp.call(target, insTarget)) continue;
          insValue = target[insTarget];
          this.instruction(insTarget, insValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        node = new XMLProcessingInstruction(this, target, value);
        this.onData(this.writer.processingInstruction(node, this.currentLevel + 1));
      }
      return this;
    };

    XMLDocumentCB.prototype.declaration = function(version, encoding, standalone) {
      var node;
      this.openCurrent();
      if (this.documentStarted) {
        throw new Error("declaration() must be the first node");
      }
      node = new XMLDeclaration(this, version, encoding, standalone);
      this.onData(this.writer.declaration(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.doctype = function(root, pubID, sysID) {
      this.openCurrent();
      if (root == null) {
        throw new Error("Missing root node name");
      }
      if (this.root) {
        throw new Error("dtd() must come before the root node");
      }
      this.currentNode = new XMLDocType(this, pubID, sysID);
      this.currentNode.rootNodeName = root;
      this.currentNode.children = false;
      this.currentLevel++;
      this.openTags[this.currentLevel] = this.currentNode;
      return this;
    };

    XMLDocumentCB.prototype.dtdElement = function(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDElement(this, name, value);
      this.onData(this.writer.dtdElement(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      var node;
      this.openCurrent();
      node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
      this.onData(this.writer.dtdAttList(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.entity = function(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDEntity(this, false, name, value);
      this.onData(this.writer.dtdEntity(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.pEntity = function(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDEntity(this, true, name, value);
      this.onData(this.writer.dtdEntity(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.notation = function(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDNotation(this, name, value);
      this.onData(this.writer.dtdNotation(node, this.currentLevel + 1));
      return this;
    };

    XMLDocumentCB.prototype.up = function() {
      if (this.currentLevel < 0) {
        throw new Error("The document node has no parent");
      }
      if (this.currentNode) {
        if (this.currentNode.children) {
          this.closeNode(this.currentNode);
        } else {
          this.openNode(this.currentNode);
        }
        this.currentNode = null;
      } else {
        this.closeNode(this.openTags[this.currentLevel]);
      }
      delete this.openTags[this.currentLevel];
      this.currentLevel--;
      return this;
    };

    XMLDocumentCB.prototype.end = function() {
      while (this.currentLevel >= 0) {
        this.up();
      }
      return this.onEnd();
    };

    XMLDocumentCB.prototype.openCurrent = function() {
      if (this.currentNode) {
        this.currentNode.children = true;
        return this.openNode(this.currentNode);
      }
    };

    XMLDocumentCB.prototype.openNode = function(node) {
      if (!node.isOpen) {
        if (!this.root && this.currentLevel === 0 && node instanceof XMLElement) {
          this.root = node;
        }
        this.onData(this.writer.openNode(node, this.currentLevel));
        return node.isOpen = true;
      }
    };

    XMLDocumentCB.prototype.closeNode = function(node) {
      if (!node.isClosed) {
        this.onData(this.writer.closeNode(node, this.currentLevel));
        return node.isClosed = true;
      }
    };

    XMLDocumentCB.prototype.onData = function(chunk) {
      this.documentStarted = true;
      return this.onDataCallback(chunk);
    };

    XMLDocumentCB.prototype.onEnd = function() {
      this.documentCompleted = true;
      return this.onEndCallback();
    };

    XMLDocumentCB.prototype.ele = function() {
      return this.element.apply(this, arguments);
    };

    XMLDocumentCB.prototype.nod = function(name, attributes, text) {
      return this.node(name, attributes, text);
    };

    XMLDocumentCB.prototype.txt = function(value) {
      return this.text(value);
    };

    XMLDocumentCB.prototype.dat = function(value) {
      return this.cdata(value);
    };

    XMLDocumentCB.prototype.com = function(value) {
      return this.comment(value);
    };

    XMLDocumentCB.prototype.ins = function(target, value) {
      return this.instruction(target, value);
    };

    XMLDocumentCB.prototype.dec = function(version, encoding, standalone) {
      return this.declaration(version, encoding, standalone);
    };

    XMLDocumentCB.prototype.dtd = function(root, pubID, sysID) {
      return this.doctype(root, pubID, sysID);
    };

    XMLDocumentCB.prototype.e = function(name, attributes, text) {
      return this.element(name, attributes, text);
    };

    XMLDocumentCB.prototype.n = function(name, attributes, text) {
      return this.node(name, attributes, text);
    };

    XMLDocumentCB.prototype.t = function(value) {
      return this.text(value);
    };

    XMLDocumentCB.prototype.d = function(value) {
      return this.cdata(value);
    };

    XMLDocumentCB.prototype.c = function(value) {
      return this.comment(value);
    };

    XMLDocumentCB.prototype.r = function(value) {
      return this.raw(value);
    };

    XMLDocumentCB.prototype.i = function(target, value) {
      return this.instruction(target, value);
    };

    XMLDocumentCB.prototype.att = function() {
      if (this.currentNode && this.currentNode instanceof XMLDocType) {
        return this.attList.apply(this, arguments);
      } else {
        return this.attribute.apply(this, arguments);
      }
    };

    XMLDocumentCB.prototype.a = function() {
      if (this.currentNode && this.currentNode instanceof XMLDocType) {
        return this.attList.apply(this, arguments);
      } else {
        return this.attribute.apply(this, arguments);
      }
    };

    XMLDocumentCB.prototype.ent = function(name, value) {
      return this.entity(name, value);
    };

    XMLDocumentCB.prototype.pent = function(name, value) {
      return this.pEntity(name, value);
    };

    XMLDocumentCB.prototype.not = function(name, value) {
      return this.notation(name, value);
    };

    return XMLDocumentCB;

  })();

}).call(this);

},{"./Utility":74,"./XMLAttribute":75,"./XMLCData":76,"./XMLComment":77,"./XMLDTDAttList":78,"./XMLDTDElement":79,"./XMLDTDEntity":80,"./XMLDTDNotation":81,"./XMLDeclaration":82,"./XMLDocType":83,"./XMLElement":86,"./XMLProcessingInstruction":88,"./XMLRaw":89,"./XMLStringWriter":91,"./XMLStringifier":92,"./XMLText":93}],86:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLAttribute, XMLElement, XMLNode, isFunction, isObject, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('./Utility'), isObject = ref.isObject, isFunction = ref.isFunction;

  XMLNode = require('./XMLNode');

  XMLAttribute = require('./XMLAttribute');

  module.exports = XMLElement = (function(superClass) {
    extend(XMLElement, superClass);

    function XMLElement(parent, name, attributes) {
      XMLElement.__super__.constructor.call(this, parent);
      if (name == null) {
        throw new Error("Missing element name");
      }
      this.name = this.stringify.eleName(name);
      this.attributes = {};
      if (attributes != null) {
        this.attribute(attributes);
      }
      if (parent.isDocument) {
        this.isRoot = true;
        this.documentObject = parent;
        parent.rootObject = this;
      }
    }

    XMLElement.prototype.clone = function() {
      var att, attName, clonedSelf, ref1;
      clonedSelf = Object.create(this);
      if (clonedSelf.isRoot) {
        clonedSelf.documentObject = null;
      }
      clonedSelf.attributes = {};
      ref1 = this.attributes;
      for (attName in ref1) {
        if (!hasProp.call(ref1, attName)) continue;
        att = ref1[attName];
        clonedSelf.attributes[attName] = att.clone();
      }
      clonedSelf.children = [];
      this.children.forEach(function(child) {
        var clonedChild;
        clonedChild = child.clone();
        clonedChild.parent = clonedSelf;
        return clonedSelf.children.push(clonedChild);
      });
      return clonedSelf;
    };

    XMLElement.prototype.attribute = function(name, value) {
      var attName, attValue;
      if (name != null) {
        name = name.valueOf();
      }
      if (isObject(name)) {
        for (attName in name) {
          if (!hasProp.call(name, attName)) continue;
          attValue = name[attName];
          this.attribute(attName, attValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        if (!this.options.skipNullAttributes || (value != null)) {
          this.attributes[name] = new XMLAttribute(this, name, value);
        }
      }
      return this;
    };

    XMLElement.prototype.removeAttribute = function(name) {
      var attName, i, len;
      if (name == null) {
        throw new Error("Missing attribute name");
      }
      name = name.valueOf();
      if (Array.isArray(name)) {
        for (i = 0, len = name.length; i < len; i++) {
          attName = name[i];
          delete this.attributes[attName];
        }
      } else {
        delete this.attributes[name];
      }
      return this;
    };

    XMLElement.prototype.toString = function(options) {
      return this.options.writer.set(options).element(this);
    };

    XMLElement.prototype.att = function(name, value) {
      return this.attribute(name, value);
    };

    XMLElement.prototype.a = function(name, value) {
      return this.attribute(name, value);
    };

    return XMLElement;

  })(XMLNode);

}).call(this);

},{"./Utility":74,"./XMLAttribute":75,"./XMLNode":87}],87:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLElement, XMLNode, XMLProcessingInstruction, XMLRaw, XMLText, isEmpty, isFunction, isObject, ref,
    hasProp = {}.hasOwnProperty;

  ref = require('./Utility'), isObject = ref.isObject, isFunction = ref.isFunction, isEmpty = ref.isEmpty;

  XMLElement = null;

  XMLCData = null;

  XMLComment = null;

  XMLDeclaration = null;

  XMLDocType = null;

  XMLRaw = null;

  XMLText = null;

  XMLProcessingInstruction = null;

  module.exports = XMLNode = (function() {
    function XMLNode(parent) {
      this.parent = parent;
      if (this.parent) {
        this.options = this.parent.options;
        this.stringify = this.parent.stringify;
      }
      this.children = [];
      if (!XMLElement) {
        XMLElement = require('./XMLElement');
        XMLCData = require('./XMLCData');
        XMLComment = require('./XMLComment');
        XMLDeclaration = require('./XMLDeclaration');
        XMLDocType = require('./XMLDocType');
        XMLRaw = require('./XMLRaw');
        XMLText = require('./XMLText');
        XMLProcessingInstruction = require('./XMLProcessingInstruction');
      }
    }

    XMLNode.prototype.element = function(name, attributes, text) {
      var childNode, item, j, k, key, lastChild, len, len1, ref1, val;
      lastChild = null;
      if (attributes == null) {
        attributes = {};
      }
      attributes = attributes.valueOf();
      if (!isObject(attributes)) {
        ref1 = [attributes, text], text = ref1[0], attributes = ref1[1];
      }
      if (name != null) {
        name = name.valueOf();
      }
      if (Array.isArray(name)) {
        for (j = 0, len = name.length; j < len; j++) {
          item = name[j];
          lastChild = this.element(item);
        }
      } else if (isFunction(name)) {
        lastChild = this.element(name.apply());
      } else if (isObject(name)) {
        for (key in name) {
          if (!hasProp.call(name, key)) continue;
          val = name[key];
          if (isFunction(val)) {
            val = val.apply();
          }
          if ((isObject(val)) && (isEmpty(val))) {
            val = null;
          }
          if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
            lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
          } else if (!this.options.separateArrayItems && Array.isArray(val)) {
            for (k = 0, len1 = val.length; k < len1; k++) {
              item = val[k];
              childNode = {};
              childNode[key] = item;
              lastChild = this.element(childNode);
            }
          } else if (isObject(val)) {
            lastChild = this.element(key);
            lastChild.element(val);
          } else {
            lastChild = this.element(key, val);
          }
        }
      } else {
        if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
          lastChild = this.text(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
          lastChild = this.cdata(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
          lastChild = this.comment(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
          lastChild = this.raw(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && name.indexOf(this.stringify.convertPIKey) === 0) {
          lastChild = this.instruction(name.substr(this.stringify.convertPIKey.length), text);
        } else {
          lastChild = this.node(name, attributes, text);
        }
      }
      if (lastChild == null) {
        throw new Error("Could not create any elements with: " + name);
      }
      return lastChild;
    };

    XMLNode.prototype.insertBefore = function(name, attributes, text) {
      var child, i, removed;
      if (this.isRoot) {
        throw new Error("Cannot insert elements at root level");
      }
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i);
      child = this.parent.element(name, attributes, text);
      Array.prototype.push.apply(this.parent.children, removed);
      return child;
    };

    XMLNode.prototype.insertAfter = function(name, attributes, text) {
      var child, i, removed;
      if (this.isRoot) {
        throw new Error("Cannot insert elements at root level");
      }
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i + 1);
      child = this.parent.element(name, attributes, text);
      Array.prototype.push.apply(this.parent.children, removed);
      return child;
    };

    XMLNode.prototype.remove = function() {
      var i, ref1;
      if (this.isRoot) {
        throw new Error("Cannot remove the root element");
      }
      i = this.parent.children.indexOf(this);
      [].splice.apply(this.parent.children, [i, i - i + 1].concat(ref1 = [])), ref1;
      return this.parent;
    };

    XMLNode.prototype.node = function(name, attributes, text) {
      var child, ref1;
      if (name != null) {
        name = name.valueOf();
      }
      attributes || (attributes = {});
      attributes = attributes.valueOf();
      if (!isObject(attributes)) {
        ref1 = [attributes, text], text = ref1[0], attributes = ref1[1];
      }
      child = new XMLElement(this, name, attributes);
      if (text != null) {
        child.text(text);
      }
      this.children.push(child);
      return child;
    };

    XMLNode.prototype.text = function(value) {
      var child;
      child = new XMLText(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.cdata = function(value) {
      var child;
      child = new XMLCData(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.comment = function(value) {
      var child;
      child = new XMLComment(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.commentBefore = function(value) {
      var child, i, removed;
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i);
      child = this.parent.comment(value);
      Array.prototype.push.apply(this.parent.children, removed);
      return this;
    };

    XMLNode.prototype.commentAfter = function(value) {
      var child, i, removed;
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i + 1);
      child = this.parent.comment(value);
      Array.prototype.push.apply(this.parent.children, removed);
      return this;
    };

    XMLNode.prototype.raw = function(value) {
      var child;
      child = new XMLRaw(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.instruction = function(target, value) {
      var insTarget, insValue, instruction, j, len;
      if (target != null) {
        target = target.valueOf();
      }
      if (value != null) {
        value = value.valueOf();
      }
      if (Array.isArray(target)) {
        for (j = 0, len = target.length; j < len; j++) {
          insTarget = target[j];
          this.instruction(insTarget);
        }
      } else if (isObject(target)) {
        for (insTarget in target) {
          if (!hasProp.call(target, insTarget)) continue;
          insValue = target[insTarget];
          this.instruction(insTarget, insValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        instruction = new XMLProcessingInstruction(this, target, value);
        this.children.push(instruction);
      }
      return this;
    };

    XMLNode.prototype.instructionBefore = function(target, value) {
      var child, i, removed;
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i);
      child = this.parent.instruction(target, value);
      Array.prototype.push.apply(this.parent.children, removed);
      return this;
    };

    XMLNode.prototype.instructionAfter = function(target, value) {
      var child, i, removed;
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i + 1);
      child = this.parent.instruction(target, value);
      Array.prototype.push.apply(this.parent.children, removed);
      return this;
    };

    XMLNode.prototype.declaration = function(version, encoding, standalone) {
      var doc, xmldec;
      doc = this.document();
      xmldec = new XMLDeclaration(doc, version, encoding, standalone);
      if (doc.children[0] instanceof XMLDeclaration) {
        doc.children[0] = xmldec;
      } else {
        doc.children.unshift(xmldec);
      }
      return doc.root() || doc;
    };

    XMLNode.prototype.doctype = function(pubID, sysID) {
      var child, doc, doctype, i, j, k, len, len1, ref1, ref2;
      doc = this.document();
      doctype = new XMLDocType(doc, pubID, sysID);
      ref1 = doc.children;
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        child = ref1[i];
        if (child instanceof XMLDocType) {
          doc.children[i] = doctype;
          return doctype;
        }
      }
      ref2 = doc.children;
      for (i = k = 0, len1 = ref2.length; k < len1; i = ++k) {
        child = ref2[i];
        if (child.isRoot) {
          doc.children.splice(i, 0, doctype);
          return doctype;
        }
      }
      doc.children.push(doctype);
      return doctype;
    };

    XMLNode.prototype.up = function() {
      if (this.isRoot) {
        throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
      }
      return this.parent;
    };

    XMLNode.prototype.root = function() {
      var node;
      node = this;
      while (node) {
        if (node.isDocument) {
          return node.rootObject;
        } else if (node.isRoot) {
          return node;
        } else {
          node = node.parent;
        }
      }
    };

    XMLNode.prototype.document = function() {
      var node;
      node = this;
      while (node) {
        if (node.isDocument) {
          return node;
        } else {
          node = node.parent;
        }
      }
    };

    XMLNode.prototype.end = function(options) {
      return this.document().end(options);
    };

    XMLNode.prototype.prev = function() {
      var i;
      i = this.parent.children.indexOf(this);
      if (i < 1) {
        throw new Error("Already at the first node");
      }
      return this.parent.children[i - 1];
    };

    XMLNode.prototype.next = function() {
      var i;
      i = this.parent.children.indexOf(this);
      if (i === -1 || i === this.parent.children.length - 1) {
        throw new Error("Already at the last node");
      }
      return this.parent.children[i + 1];
    };

    XMLNode.prototype.importDocument = function(doc) {
      var clonedRoot;
      clonedRoot = doc.root().clone();
      clonedRoot.parent = this;
      clonedRoot.isRoot = false;
      this.children.push(clonedRoot);
      return this;
    };

    XMLNode.prototype.ele = function(name, attributes, text) {
      return this.element(name, attributes, text);
    };

    XMLNode.prototype.nod = function(name, attributes, text) {
      return this.node(name, attributes, text);
    };

    XMLNode.prototype.txt = function(value) {
      return this.text(value);
    };

    XMLNode.prototype.dat = function(value) {
      return this.cdata(value);
    };

    XMLNode.prototype.com = function(value) {
      return this.comment(value);
    };

    XMLNode.prototype.ins = function(target, value) {
      return this.instruction(target, value);
    };

    XMLNode.prototype.doc = function() {
      return this.document();
    };

    XMLNode.prototype.dec = function(version, encoding, standalone) {
      return this.declaration(version, encoding, standalone);
    };

    XMLNode.prototype.dtd = function(pubID, sysID) {
      return this.doctype(pubID, sysID);
    };

    XMLNode.prototype.e = function(name, attributes, text) {
      return this.element(name, attributes, text);
    };

    XMLNode.prototype.n = function(name, attributes, text) {
      return this.node(name, attributes, text);
    };

    XMLNode.prototype.t = function(value) {
      return this.text(value);
    };

    XMLNode.prototype.d = function(value) {
      return this.cdata(value);
    };

    XMLNode.prototype.c = function(value) {
      return this.comment(value);
    };

    XMLNode.prototype.r = function(value) {
      return this.raw(value);
    };

    XMLNode.prototype.i = function(target, value) {
      return this.instruction(target, value);
    };

    XMLNode.prototype.u = function() {
      return this.up();
    };

    XMLNode.prototype.importXMLBuilder = function(doc) {
      return this.importDocument(doc);
    };

    return XMLNode;

  })();

}).call(this);

},{"./Utility":74,"./XMLCData":76,"./XMLComment":77,"./XMLDeclaration":82,"./XMLDocType":83,"./XMLElement":86,"./XMLProcessingInstruction":88,"./XMLRaw":89,"./XMLText":93}],88:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLNode, XMLProcessingInstruction,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLProcessingInstruction = (function(superClass) {
    extend(XMLProcessingInstruction, superClass);

    function XMLProcessingInstruction(parent, target, value) {
      XMLProcessingInstruction.__super__.constructor.call(this, parent);
      if (target == null) {
        throw new Error("Missing instruction target");
      }
      this.target = this.stringify.insTarget(target);
      if (value) {
        this.value = this.stringify.insValue(value);
      }
    }

    XMLProcessingInstruction.prototype.clone = function() {
      return Object.create(this);
    };

    XMLProcessingInstruction.prototype.toString = function(options) {
      return this.options.writer.set(options).processingInstruction(this);
    };

    return XMLProcessingInstruction;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],89:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLNode, XMLRaw,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLRaw = (function(superClass) {
    extend(XMLRaw, superClass);

    function XMLRaw(parent, text) {
      XMLRaw.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing raw text");
      }
      this.value = this.stringify.raw(text);
    }

    XMLRaw.prototype.clone = function() {
      return Object.create(this);
    };

    XMLRaw.prototype.toString = function(options) {
      return this.options.writer.set(options).raw(this);
    };

    return XMLRaw;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],90:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStreamWriter, XMLText, XMLWriterBase,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLDeclaration = require('./XMLDeclaration');

  XMLDocType = require('./XMLDocType');

  XMLCData = require('./XMLCData');

  XMLComment = require('./XMLComment');

  XMLElement = require('./XMLElement');

  XMLRaw = require('./XMLRaw');

  XMLText = require('./XMLText');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDNotation = require('./XMLDTDNotation');

  XMLWriterBase = require('./XMLWriterBase');

  module.exports = XMLStreamWriter = (function(superClass) {
    extend(XMLStreamWriter, superClass);

    function XMLStreamWriter(stream, options) {
      this.stream = stream;
      XMLStreamWriter.__super__.constructor.call(this, options);
    }

    XMLStreamWriter.prototype.document = function(doc) {
      var child, i, j, len, len1, ref, ref1, results;
      ref = doc.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        child.isLastRootNode = false;
      }
      doc.children[doc.children.length - 1].isLastRootNode = true;
      ref1 = doc.children;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        child = ref1[j];
        switch (false) {
          case !(child instanceof XMLDeclaration):
            results.push(this.declaration(child));
            break;
          case !(child instanceof XMLDocType):
            results.push(this.docType(child));
            break;
          case !(child instanceof XMLComment):
            results.push(this.comment(child));
            break;
          case !(child instanceof XMLProcessingInstruction):
            results.push(this.processingInstruction(child));
            break;
          default:
            results.push(this.element(child));
        }
      }
      return results;
    };

    XMLStreamWriter.prototype.attribute = function(att) {
      return this.stream.write(' ' + att.name + '="' + att.value + '"');
    };

    XMLStreamWriter.prototype.cdata = function(node, level) {
      return this.stream.write(this.space(level) + '<![CDATA[' + node.text + ']]>' + this.endline(node));
    };

    XMLStreamWriter.prototype.comment = function(node, level) {
      return this.stream.write(this.space(level) + '<!-- ' + node.text + ' -->' + this.endline(node));
    };

    XMLStreamWriter.prototype.declaration = function(node, level) {
      this.stream.write(this.space(level));
      this.stream.write('<?xml version="' + node.version + '"');
      if (node.encoding != null) {
        this.stream.write(' encoding="' + node.encoding + '"');
      }
      if (node.standalone != null) {
        this.stream.write(' standalone="' + node.standalone + '"');
      }
      this.stream.write('?>');
      return this.stream.write(this.endline(node));
    };

    XMLStreamWriter.prototype.docType = function(node, level) {
      var child, i, len, ref;
      level || (level = 0);
      this.stream.write(this.space(level));
      this.stream.write('<!DOCTYPE ' + node.root().name);
      if (node.pubID && node.sysID) {
        this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
      } else if (node.sysID) {
        this.stream.write(' SYSTEM "' + node.sysID + '"');
      }
      if (node.children.length > 0) {
        this.stream.write(' [');
        this.stream.write(this.endline(node));
        ref = node.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          switch (false) {
            case !(child instanceof XMLDTDAttList):
              this.dtdAttList(child, level + 1);
              break;
            case !(child instanceof XMLDTDElement):
              this.dtdElement(child, level + 1);
              break;
            case !(child instanceof XMLDTDEntity):
              this.dtdEntity(child, level + 1);
              break;
            case !(child instanceof XMLDTDNotation):
              this.dtdNotation(child, level + 1);
              break;
            case !(child instanceof XMLCData):
              this.cdata(child, level + 1);
              break;
            case !(child instanceof XMLComment):
              this.comment(child, level + 1);
              break;
            case !(child instanceof XMLProcessingInstruction):
              this.processingInstruction(child, level + 1);
              break;
            default:
              throw new Error("Unknown DTD node type: " + child.constructor.name);
          }
        }
        this.stream.write(']');
      }
      this.stream.write('>');
      return this.stream.write(this.endline(node));
    };

    XMLStreamWriter.prototype.element = function(node, level) {
      var att, child, i, len, name, ref, ref1, space;
      level || (level = 0);
      space = this.space(level);
      this.stream.write(space + '<' + node.name);
      ref = node.attributes;
      for (name in ref) {
        if (!hasProp.call(ref, name)) continue;
        att = ref[name];
        this.attribute(att);
      }
      if (node.children.length === 0 || node.children.every(function(e) {
        return e.value === '';
      })) {
        if (this.allowEmpty) {
          this.stream.write('></' + node.name + '>');
        } else {
          this.stream.write('/>');
        }
      } else if (this.pretty && node.children.length === 1 && (node.children[0].value != null)) {
        this.stream.write('>');
        this.stream.write(node.children[0].value);
        this.stream.write('</' + node.name + '>');
      } else {
        this.stream.write('>' + this.newline);
        ref1 = node.children;
        for (i = 0, len = ref1.length; i < len; i++) {
          child = ref1[i];
          switch (false) {
            case !(child instanceof XMLCData):
              this.cdata(child, level + 1);
              break;
            case !(child instanceof XMLComment):
              this.comment(child, level + 1);
              break;
            case !(child instanceof XMLElement):
              this.element(child, level + 1);
              break;
            case !(child instanceof XMLRaw):
              this.raw(child, level + 1);
              break;
            case !(child instanceof XMLText):
              this.text(child, level + 1);
              break;
            case !(child instanceof XMLProcessingInstruction):
              this.processingInstruction(child, level + 1);
              break;
            default:
              throw new Error("Unknown XML node type: " + child.constructor.name);
          }
        }
        this.stream.write(space + '</' + node.name + '>');
      }
      return this.stream.write(this.endline(node));
    };

    XMLStreamWriter.prototype.processingInstruction = function(node, level) {
      this.stream.write(this.space(level) + '<?' + node.target);
      if (node.value) {
        this.stream.write(' ' + node.value);
      }
      return this.stream.write('?>' + this.endline(node));
    };

    XMLStreamWriter.prototype.raw = function(node, level) {
      return this.stream.write(this.space(level) + node.value + this.endline(node));
    };

    XMLStreamWriter.prototype.text = function(node, level) {
      return this.stream.write(this.space(level) + node.value + this.endline(node));
    };

    XMLStreamWriter.prototype.dtdAttList = function(node, level) {
      this.stream.write(this.space(level) + '<!ATTLIST ' + node.elementName + ' ' + node.attributeName + ' ' + node.attributeType);
      if (node.defaultValueType !== '#DEFAULT') {
        this.stream.write(' ' + node.defaultValueType);
      }
      if (node.defaultValue) {
        this.stream.write(' "' + node.defaultValue + '"');
      }
      return this.stream.write('>' + this.endline(node));
    };

    XMLStreamWriter.prototype.dtdElement = function(node, level) {
      return this.stream.write(this.space(level) + '<!ELEMENT ' + node.name + ' ' + node.value + '>' + this.endline(node));
    };

    XMLStreamWriter.prototype.dtdEntity = function(node, level) {
      this.stream.write(this.space(level) + '<!ENTITY');
      if (node.pe) {
        this.stream.write(' %');
      }
      this.stream.write(' ' + node.name);
      if (node.value) {
        this.stream.write(' "' + node.value + '"');
      } else {
        if (node.pubID && node.sysID) {
          this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
        } else if (node.sysID) {
          this.stream.write(' SYSTEM "' + node.sysID + '"');
        }
        if (node.nData) {
          this.stream.write(' NDATA ' + node.nData);
        }
      }
      return this.stream.write('>' + this.endline(node));
    };

    XMLStreamWriter.prototype.dtdNotation = function(node, level) {
      this.stream.write(this.space(level) + '<!NOTATION ' + node.name);
      if (node.pubID && node.sysID) {
        this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
      } else if (node.pubID) {
        this.stream.write(' PUBLIC "' + node.pubID + '"');
      } else if (node.sysID) {
        this.stream.write(' SYSTEM "' + node.sysID + '"');
      }
      return this.stream.write('>' + this.endline(node));
    };

    XMLStreamWriter.prototype.endline = function(node) {
      if (!node.isLastRootNode) {
        return this.newline;
      } else {
        return '';
      }
    };

    return XMLStreamWriter;

  })(XMLWriterBase);

}).call(this);

},{"./XMLCData":76,"./XMLComment":77,"./XMLDTDAttList":78,"./XMLDTDElement":79,"./XMLDTDEntity":80,"./XMLDTDNotation":81,"./XMLDeclaration":82,"./XMLDocType":83,"./XMLElement":86,"./XMLProcessingInstruction":88,"./XMLRaw":89,"./XMLText":93,"./XMLWriterBase":94}],91:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLText, XMLWriterBase,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLDeclaration = require('./XMLDeclaration');

  XMLDocType = require('./XMLDocType');

  XMLCData = require('./XMLCData');

  XMLComment = require('./XMLComment');

  XMLElement = require('./XMLElement');

  XMLRaw = require('./XMLRaw');

  XMLText = require('./XMLText');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDNotation = require('./XMLDTDNotation');

  XMLWriterBase = require('./XMLWriterBase');

  module.exports = XMLStringWriter = (function(superClass) {
    extend(XMLStringWriter, superClass);

    function XMLStringWriter(options) {
      XMLStringWriter.__super__.constructor.call(this, options);
    }

    XMLStringWriter.prototype.document = function(doc) {
      var child, i, len, r, ref;
      r = '';
      ref = doc.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        r += (function() {
          switch (false) {
            case !(child instanceof XMLDeclaration):
              return this.declaration(child);
            case !(child instanceof XMLDocType):
              return this.docType(child);
            case !(child instanceof XMLComment):
              return this.comment(child);
            case !(child instanceof XMLProcessingInstruction):
              return this.processingInstruction(child);
            default:
              return this.element(child, 0);
          }
        }).call(this);
      }
      if (this.pretty && r.slice(-this.newline.length) === this.newline) {
        r = r.slice(0, -this.newline.length);
      }
      return r;
    };

    XMLStringWriter.prototype.attribute = function(att) {
      return ' ' + att.name + '="' + att.value + '"';
    };

    XMLStringWriter.prototype.cdata = function(node, level) {
      return this.space(level) + '<![CDATA[' + node.text + ']]>' + this.newline;
    };

    XMLStringWriter.prototype.comment = function(node, level) {
      return this.space(level) + '<!-- ' + node.text + ' -->' + this.newline;
    };

    XMLStringWriter.prototype.declaration = function(node, level) {
      var r;
      r = this.space(level);
      r += '<?xml version="' + node.version + '"';
      if (node.encoding != null) {
        r += ' encoding="' + node.encoding + '"';
      }
      if (node.standalone != null) {
        r += ' standalone="' + node.standalone + '"';
      }
      r += '?>';
      r += this.newline;
      return r;
    };

    XMLStringWriter.prototype.docType = function(node, level) {
      var child, i, len, r, ref;
      level || (level = 0);
      r = this.space(level);
      r += '<!DOCTYPE ' + node.root().name;
      if (node.pubID && node.sysID) {
        r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
      } else if (node.sysID) {
        r += ' SYSTEM "' + node.sysID + '"';
      }
      if (node.children.length > 0) {
        r += ' [';
        r += this.newline;
        ref = node.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          r += (function() {
            switch (false) {
              case !(child instanceof XMLDTDAttList):
                return this.dtdAttList(child, level + 1);
              case !(child instanceof XMLDTDElement):
                return this.dtdElement(child, level + 1);
              case !(child instanceof XMLDTDEntity):
                return this.dtdEntity(child, level + 1);
              case !(child instanceof XMLDTDNotation):
                return this.dtdNotation(child, level + 1);
              case !(child instanceof XMLCData):
                return this.cdata(child, level + 1);
              case !(child instanceof XMLComment):
                return this.comment(child, level + 1);
              case !(child instanceof XMLProcessingInstruction):
                return this.processingInstruction(child, level + 1);
              default:
                throw new Error("Unknown DTD node type: " + child.constructor.name);
            }
          }).call(this);
        }
        r += ']';
      }
      r += '>';
      r += this.newline;
      return r;
    };

    XMLStringWriter.prototype.element = function(node, level) {
      var att, child, i, len, name, r, ref, ref1, space;
      level || (level = 0);
      space = this.space(level);
      r = '';
      r += space + '<' + node.name;
      ref = node.attributes;
      for (name in ref) {
        if (!hasProp.call(ref, name)) continue;
        att = ref[name];
        r += this.attribute(att);
      }
      if (node.children.length === 0 || node.children.every(function(e) {
        return e.value === '';
      })) {
        if (this.allowEmpty) {
          r += '></' + node.name + '>' + this.newline;
        } else {
          r += '/>' + this.newline;
        }
      } else if (this.pretty && node.children.length === 1 && (node.children[0].value != null)) {
        r += '>';
        r += node.children[0].value;
        r += '</' + node.name + '>' + this.newline;
      } else {
        r += '>' + this.newline;
        ref1 = node.children;
        for (i = 0, len = ref1.length; i < len; i++) {
          child = ref1[i];
          r += (function() {
            switch (false) {
              case !(child instanceof XMLCData):
                return this.cdata(child, level + 1);
              case !(child instanceof XMLComment):
                return this.comment(child, level + 1);
              case !(child instanceof XMLElement):
                return this.element(child, level + 1);
              case !(child instanceof XMLRaw):
                return this.raw(child, level + 1);
              case !(child instanceof XMLText):
                return this.text(child, level + 1);
              case !(child instanceof XMLProcessingInstruction):
                return this.processingInstruction(child, level + 1);
              default:
                throw new Error("Unknown XML node type: " + child.constructor.name);
            }
          }).call(this);
        }
        r += space + '</' + node.name + '>' + this.newline;
      }
      return r;
    };

    XMLStringWriter.prototype.processingInstruction = function(node, level) {
      var r;
      r = this.space(level) + '<?' + node.target;
      if (node.value) {
        r += ' ' + node.value;
      }
      r += '?>' + this.newline;
      return r;
    };

    XMLStringWriter.prototype.raw = function(node, level) {
      return this.space(level) + node.value + this.newline;
    };

    XMLStringWriter.prototype.text = function(node, level) {
      return this.space(level) + node.value + this.newline;
    };

    XMLStringWriter.prototype.dtdAttList = function(node, level) {
      var r;
      r = this.space(level) + '<!ATTLIST ' + node.elementName + ' ' + node.attributeName + ' ' + node.attributeType;
      if (node.defaultValueType !== '#DEFAULT') {
        r += ' ' + node.defaultValueType;
      }
      if (node.defaultValue) {
        r += ' "' + node.defaultValue + '"';
      }
      r += '>' + this.newline;
      return r;
    };

    XMLStringWriter.prototype.dtdElement = function(node, level) {
      return this.space(level) + '<!ELEMENT ' + node.name + ' ' + node.value + '>' + this.newline;
    };

    XMLStringWriter.prototype.dtdEntity = function(node, level) {
      var r;
      r = this.space(level) + '<!ENTITY';
      if (node.pe) {
        r += ' %';
      }
      r += ' ' + node.name;
      if (node.value) {
        r += ' "' + node.value + '"';
      } else {
        if (node.pubID && node.sysID) {
          r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
        } else if (node.sysID) {
          r += ' SYSTEM "' + node.sysID + '"';
        }
        if (node.nData) {
          r += ' NDATA ' + node.nData;
        }
      }
      r += '>' + this.newline;
      return r;
    };

    XMLStringWriter.prototype.dtdNotation = function(node, level) {
      var r;
      r = this.space(level) + '<!NOTATION ' + node.name;
      if (node.pubID && node.sysID) {
        r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
      } else if (node.pubID) {
        r += ' PUBLIC "' + node.pubID + '"';
      } else if (node.sysID) {
        r += ' SYSTEM "' + node.sysID + '"';
      }
      r += '>' + this.newline;
      return r;
    };

    XMLStringWriter.prototype.openNode = function(node, level) {
      var att, name, r, ref;
      level || (level = 0);
      if (node instanceof XMLElement) {
        r = this.space(level) + '<' + node.name;
        ref = node.attributes;
        for (name in ref) {
          if (!hasProp.call(ref, name)) continue;
          att = ref[name];
          r += this.attribute(att);
        }
        r += (node.children ? '>' : '/>') + this.newline;
        return r;
      } else {
        r = this.space(level) + '<!DOCTYPE ' + node.rootNodeName;
        if (node.pubID && node.sysID) {
          r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
        } else if (node.sysID) {
          r += ' SYSTEM "' + node.sysID + '"';
        }
        r += (node.children ? ' [' : '>') + this.newline;
        return r;
      }
    };

    XMLStringWriter.prototype.closeNode = function(node, level) {
      level || (level = 0);
      switch (false) {
        case !(node instanceof XMLElement):
          return this.space(level) + '</' + node.name + '>' + this.newline;
        case !(node instanceof XMLDocType):
          return this.space(level) + ']>' + this.newline;
      }
    };

    return XMLStringWriter;

  })(XMLWriterBase);

}).call(this);

},{"./XMLCData":76,"./XMLComment":77,"./XMLDTDAttList":78,"./XMLDTDElement":79,"./XMLDTDEntity":80,"./XMLDTDNotation":81,"./XMLDeclaration":82,"./XMLDocType":83,"./XMLElement":86,"./XMLProcessingInstruction":88,"./XMLRaw":89,"./XMLText":93,"./XMLWriterBase":94}],92:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLStringifier, camelCase, kebabCase, ref, snakeCase, titleCase,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    hasProp = {}.hasOwnProperty;

  ref = require('./Utility'), camelCase = ref.camelCase, titleCase = ref.titleCase, kebabCase = ref.kebabCase, snakeCase = ref.snakeCase;

  module.exports = XMLStringifier = (function() {
    function XMLStringifier(options) {
      this.assertLegalChar = bind(this.assertLegalChar, this);
      var key, ref1, value;
      options || (options = {});
      this.allowSurrogateChars = options.allowSurrogateChars;
      this.noDoubleEncoding = options.noDoubleEncoding;
      this.textCase = options.textCase;
      ref1 = options.stringify || {};
      for (key in ref1) {
        if (!hasProp.call(ref1, key)) continue;
        value = ref1[key];
        this[key] = value;
      }
    }

    XMLStringifier.prototype.eleName = function(val) {
      val = '' + val || '';
      val = this.applyCase(val);
      return this.assertLegalChar(val);
    };

    XMLStringifier.prototype.eleText = function(val) {
      val = '' + val || '';
      return this.assertLegalChar(this.elEscape(val));
    };

    XMLStringifier.prototype.cdata = function(val) {
      val = '' + val || '';
      val = val.replace(']]>', ']]]]><![CDATA[>');
      return this.assertLegalChar(val);
    };

    XMLStringifier.prototype.comment = function(val) {
      val = '' + val || '';
      if (val.match(/--/)) {
        throw new Error("Comment text cannot contain double-hypen: " + val);
      }
      return this.assertLegalChar(val);
    };

    XMLStringifier.prototype.raw = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.attName = function(val) {
      val = '' + val || '';
      return val = this.applyCase(val);
    };

    XMLStringifier.prototype.attValue = function(val) {
      val = '' + val || '';
      return this.attEscape(val);
    };

    XMLStringifier.prototype.insTarget = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.insValue = function(val) {
      val = '' + val || '';
      if (val.match(/\?>/)) {
        throw new Error("Invalid processing instruction value: " + val);
      }
      return val;
    };

    XMLStringifier.prototype.xmlVersion = function(val) {
      val = '' + val || '';
      if (!val.match(/1\.[0-9]+/)) {
        throw new Error("Invalid version number: " + val);
      }
      return val;
    };

    XMLStringifier.prototype.xmlEncoding = function(val) {
      val = '' + val || '';
      if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-]|-)*$/)) {
        throw new Error("Invalid encoding: " + val);
      }
      return val;
    };

    XMLStringifier.prototype.xmlStandalone = function(val) {
      if (val) {
        return "yes";
      } else {
        return "no";
      }
    };

    XMLStringifier.prototype.dtdPubID = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdSysID = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdElementValue = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdAttType = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdAttDefault = function(val) {
      if (val != null) {
        return '' + val || '';
      } else {
        return val;
      }
    };

    XMLStringifier.prototype.dtdEntityValue = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdNData = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.convertAttKey = '@';

    XMLStringifier.prototype.convertPIKey = '?';

    XMLStringifier.prototype.convertTextKey = '#text';

    XMLStringifier.prototype.convertCDataKey = '#cdata';

    XMLStringifier.prototype.convertCommentKey = '#comment';

    XMLStringifier.prototype.convertRawKey = '#raw';

    XMLStringifier.prototype.assertLegalChar = function(str) {
      var chars, chr;
      if (this.allowSurrogateChars) {
        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFE-\uFFFF]/;
      } else {
        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/;
      }
      chr = str.match(chars);
      if (chr) {
        throw new Error("Invalid character (" + chr + ") in string: " + str + " at index " + chr.index);
      }
      return str;
    };

    XMLStringifier.prototype.applyCase = function(str) {
      switch (this.textCase) {
        case "camel":
          return camelCase(str);
        case "title":
          return titleCase(str);
        case "kebab":
        case "lower":
          return kebabCase(str);
        case "snake":
          return snakeCase(str);
        case "upper":
          return kebabCase(str).toUpperCase();
        default:
          return str;
      }
    };

    XMLStringifier.prototype.elEscape = function(str) {
      var ampregex;
      ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
      return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
    };

    XMLStringifier.prototype.attEscape = function(str) {
      var ampregex;
      ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
      return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
    };

    return XMLStringifier;

  })();

}).call(this);

},{"./Utility":74}],93:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLNode, XMLText,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  XMLNode = require('./XMLNode');

  module.exports = XMLText = (function(superClass) {
    extend(XMLText, superClass);

    function XMLText(parent, text) {
      XMLText.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing element text");
      }
      this.value = this.stringify.eleText(text);
    }

    XMLText.prototype.clone = function() {
      return Object.create(this);
    };

    XMLText.prototype.toString = function(options) {
      return this.options.writer.set(options).text(this);
    };

    return XMLText;

  })(XMLNode);

}).call(this);

},{"./XMLNode":87}],94:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLWriterBase,
    hasProp = {}.hasOwnProperty;

  module.exports = XMLWriterBase = (function() {
    function XMLWriterBase(options) {
      var key, ref, ref1, ref2, ref3, ref4, value;
      options || (options = {});
      this.pretty = options.pretty || false;
      this.allowEmpty = (ref = options.allowEmpty) != null ? ref : false;
      if (this.pretty) {
        this.indent = (ref1 = options.indent) != null ? ref1 : '  ';
        this.newline = (ref2 = options.newline) != null ? ref2 : '\n';
        this.offset = (ref3 = options.offset) != null ? ref3 : 0;
      } else {
        this.indent = '';
        this.newline = '';
        this.offset = 0;
      }
      ref4 = options.writer || {};
      for (key in ref4) {
        if (!hasProp.call(ref4, key)) continue;
        value = ref4[key];
        this[key] = value;
      }
    }

    XMLWriterBase.prototype.set = function(options) {
      var key, ref, value;
      options || (options = {});
      if ("pretty" in options) {
        this.pretty = options.pretty;
      }
      if ("allowEmpty" in options) {
        this.allowEmpty = options.allowEmpty;
      }
      if (this.pretty) {
        this.indent = "indent" in options ? options.indent : '  ';
        this.newline = "newline" in options ? options.newline : '\n';
        this.offset = "offset" in options ? options.offset : 0;
      } else {
        this.indent = '';
        this.newline = '';
        this.offset = 0;
      }
      ref = options.writer || {};
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        value = ref[key];
        this[key] = value;
      }
      return this;
    };

    XMLWriterBase.prototype.space = function(level) {
      if (this.pretty) {
        return new Array((level || 0) + this.offset + 1).join(this.indent);
      } else {
        return '';
      }
    };

    return XMLWriterBase;

  })();

}).call(this);

},{}],95:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction, ref;

  ref = require('./Utility'), assign = ref.assign, isFunction = ref.isFunction;

  XMLDocument = require('./XMLDocument');

  XMLDocumentCB = require('./XMLDocumentCB');

  XMLStringWriter = require('./XMLStringWriter');

  XMLStreamWriter = require('./XMLStreamWriter');

  module.exports.create = function(name, xmldec, doctype, options) {
    var doc, root;
    if (name == null) {
      throw new Error("Root element needs a name");
    }
    options = assign({}, xmldec, doctype, options);
    doc = new XMLDocument(options);
    root = doc.element(name);
    if (!options.headless) {
      doc.declaration(options);
      if ((options.pubID != null) || (options.sysID != null)) {
        doc.doctype(options);
      }
    }
    return root;
  };

  module.exports.begin = function(options, onData, onEnd) {
    var ref1;
    if (isFunction(options)) {
      ref1 = [options, onData], onData = ref1[0], onEnd = ref1[1];
      options = {};
    }
    if (onData) {
      return new XMLDocumentCB(options, onData, onEnd);
    } else {
      return new XMLDocument(options);
    }
  };

  module.exports.stringWriter = function(options) {
    return new XMLStringWriter(options);
  };

  module.exports.streamWriter = function(stream, options) {
    return new XMLStreamWriter(stream, options);
  };

}).call(this);

},{"./Utility":74,"./XMLDocument":84,"./XMLDocumentCB":85,"./XMLStreamWriter":90,"./XMLStringWriter":91}],96:[function(require,module,exports){
// YAML - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

/**
 * Version triplet.
 */

exports.version = '0.2.3'

// --- Helpers

/**
 * Return 'near "context"' where context
 * is replaced by a chunk of _str_.
 *
 * @param  {string} str
 * @return {string}
 * @api public
 */

function context(str) {
  if (typeof str !== 'string') return ''
  str = str
    .slice(0, 25)
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\\"')
  return 'near "' + str + '"'
}

// --- Lexer

/**
 * YAML grammar tokens.
 */

var tokens = [
  ['comment', /^#[^\n]*/],
  ['indent', /^\n( *)/],
  ['space', /^ +/],
  ['true', /^\b(enabled|true|yes|on)\b/],
  ['false', /^\b(disabled|false|no|off)\b/],
  ['null', /^\b(null|Null|NULL|~)\b/],
  ['string', /^"(.*?)"/],
  ['string', /^'(.*?)'/],
  ['timestamp', /^((\d{4})-(\d\d?)-(\d\d?)(?:(?:[ \t]+)(\d\d?):(\d\d)(?::(\d\d))?)?)/],
  ['float', /^(\d+\.\d+)/],
  ['int', /^(\d+)/],
  ['doc', /^---/],
  [',', /^,/],
  ['{', /^\{(?![^\n\}]*\}[^\n]*[^\s\n\}])/],
  ['}', /^\}/],
  ['[', /^\[(?![^\n\]]*\][^\n]*[^\s\n\]])/],
  [']', /^\]/],
  ['-', /^\-/],
  [':', /^[:]/],
  ['string', /^(?![^:\n\s]*:[^\/]{2})(([^:,\]\}\n\s]|(?!\n)\s(?!\s*?\n)|:\/\/|,(?=[^\n]*\s*[^\]\}\s\n]\s*\n)|[\]\}](?=[^\n]*\s*[^\]\}\s\n]\s*\n))*)(?=[,:\]\}\s\n]|$)/], 
  ['id', /^([\w][\w -]*)/]
]

/**
 * Tokenize the given _str_.
 *
 * @param  {string} str
 * @return {array}
 * @api private
 */

exports.tokenize = function (str) {
  var token, captures, ignore, input,
      indents = 0, lastIndents = 0,
      stack = [], indentAmount = -1
  while (str.length) {
    for (var i = 0, len = tokens.length; i < len; ++i)
      if (captures = tokens[i][1].exec(str)) {
        token = [tokens[i][0], captures],
        str = str.replace(tokens[i][1], '')
        switch (token[0]) {
          case 'comment':
            ignore = true
            break
          case 'indent':
            lastIndents = indents 
            // determine the indentation amount from the first indent
            if (indentAmount == -1) {
              indentAmount = token[1][1].length
            }

            indents = token[1][1].length / indentAmount
            if (indents === lastIndents)
              ignore = true
            else if (indents > lastIndents + 1)
              throw new SyntaxError('invalid indentation, got ' + indents + ' instead of ' + (lastIndents + 1))
            else if (indents < lastIndents) {
              input = token[1].input
              token = ['dedent']
              token.input = input
              while (--lastIndents > indents)
                stack.push(token)
            }
        }
        break
      }
    if (!ignore)
      if (token)
        stack.push(token),
        token = null
      else 
        throw new SyntaxError(context(str))
    ignore = false
  }
  return stack
}

// --- Parser

/**
 * Initialize with _tokens_.
 */

function Parser(tokens) {
  this.tokens = tokens
}

/**
 * Look-ahead a single token.
 *
 * @return {array}
 * @api public
 */

Parser.prototype.peek = function() {
  return this.tokens[0]
}

/**
 * Advance by a single token.
 *
 * @return {array}
 * @api public
 */

Parser.prototype.advance = function() {
  return this.tokens.shift()
}

/**
 * Advance and return the token's value.
 *
 * @return {mixed}
 * @api private
 */

Parser.prototype.advanceValue = function() {
  return this.advance()[1][1]
}

/**
 * Accept _type_ and advance or do nothing.
 *
 * @param  {string} type
 * @return {bool}
 * @api private
 */

Parser.prototype.accept = function(type) {
  if (this.peekType(type))
    return this.advance()
}

/**
 * Expect _type_ or throw an error _msg_.
 *
 * @param  {string} type
 * @param  {string} msg
 * @api private
 */

Parser.prototype.expect = function(type, msg) {
  if (this.accept(type)) return
  throw new Error(msg + ', ' + context(this.peek()[1].input))
}

/**
 * Return the next token type.
 *
 * @return {string}
 * @api private
 */

Parser.prototype.peekType = function(val) {
  return this.tokens[0] &&
         this.tokens[0][0] === val
}

/**
 * space*
 */

Parser.prototype.ignoreSpace = function() {
  while (this.peekType('space'))
    this.advance()
}

/**
 * (space | indent | dedent)*
 */

Parser.prototype.ignoreWhitespace = function() {
  while (this.peekType('space') ||
         this.peekType('indent') ||
         this.peekType('dedent'))
    this.advance()
}

/**
 *   block
 * | doc
 * | list
 * | inlineList
 * | hash
 * | inlineHash
 * | string
 * | float
 * | int
 * | true
 * | false
 * | null
 */

Parser.prototype.parse = function() {
  switch (this.peek()[0]) {
    case 'doc':
      return this.parseDoc()
    case '-':
      return this.parseList()
    case '{':
      return this.parseInlineHash()
    case '[':
      return this.parseInlineList()
    case 'id':
      return this.parseHash()
    case 'string':
      return this.advanceValue()
    case 'timestamp':
      return this.parseTimestamp()
    case 'float':
      return parseFloat(this.advanceValue())
    case 'int':
      return parseInt(this.advanceValue())
    case 'true':
      this.advanceValue(); return true
    case 'false':
      this.advanceValue(); return false
    case 'null':
      this.advanceValue(); return null
  }
}

/**
 * '---'? indent expr dedent
 */

Parser.prototype.parseDoc = function() {
  this.accept('doc')
  this.expect('indent', 'expected indent after document')
  var val = this.parse()
  this.expect('dedent', 'document not properly dedented')
  return val
}

/**
 *  ( id ':' - expr -
 *  | id ':' - indent expr dedent
 *  )+
 */

Parser.prototype.parseHash = function() {
  var id, hash = {}
  while (this.peekType('id') && (id = this.advanceValue())) {
    this.expect(':', 'expected semi-colon after id')
    this.ignoreSpace()
    if (this.accept('indent'))
      hash[id] = this.parse(),
      this.expect('dedent', 'hash not properly dedented')
    else
      hash[id] = this.parse()
    this.ignoreSpace()
  }
  return hash
}

/**
 * '{' (- ','? ws id ':' - expr ws)* '}'
 */

Parser.prototype.parseInlineHash = function() {
  var hash = {}, id, i = 0
  this.accept('{')
  while (!this.accept('}')) {
    this.ignoreSpace()
    if (i) this.expect(',', 'expected comma')
    this.ignoreWhitespace()
    if (this.peekType('id') && (id = this.advanceValue())) {
      this.expect(':', 'expected semi-colon after id')
      this.ignoreSpace()
      hash[id] = this.parse()
      this.ignoreWhitespace()
    }
    ++i
  }
  return hash
}

/**
 *  ( '-' - expr -
 *  | '-' - indent expr dedent
 *  )+
 */

Parser.prototype.parseList = function() {
  var list = []
  while (this.accept('-')) {
    this.ignoreSpace()
    if (this.accept('indent'))
      list.push(this.parse()),
      this.expect('dedent', 'list item not properly dedented')
    else
      list.push(this.parse())
    this.ignoreSpace()
  }
  return list
}

/**
 * '[' (- ','? - expr -)* ']'
 */

Parser.prototype.parseInlineList = function() {
  var list = [], i = 0
  this.accept('[')
  while (!this.accept(']')) {
    this.ignoreSpace()
    if (i) this.expect(',', 'expected comma')
    this.ignoreSpace()
    list.push(this.parse())
    this.ignoreSpace()
    ++i
  }
  return list
}

/**
 * yyyy-mm-dd hh:mm:ss
 *
 * For full format: http://yaml.org/type/timestamp.html
 */

Parser.prototype.parseTimestamp = function() {
  var token = this.advance()[1]
  var date = new Date
  var year = token[2]
    , month = token[3]
    , day = token[4]
    , hour = token[5] || 0 
    , min = token[6] || 0
    , sec = token[7] || 0

  date.setUTCFullYear(year, month-1, day)
  date.setUTCHours(hour)
  date.setUTCMinutes(min)
  date.setUTCSeconds(sec)
  date.setUTCMilliseconds(0)
  return date
}

/**
 * Evaluate a _str_ of yaml.
 *
 * @param  {string} str
 * @return {mixed}
 * @api public
 */

exports.eval = function(str) {
  return (new Parser(exports.tokenize(str))).parse()
}

},{}],97:[function(require,module,exports){
'use strict';

var Request = require('./base-request');

var DEFAULT_HOST = 'accounts.spotify.com',
    DEFAULT_PORT = 443,
    DEFAULT_SCHEME = 'https';

module.exports.builder = function() {
  return Request.builder()
      .withHost(DEFAULT_HOST)
      .withPort(DEFAULT_PORT)
      .withScheme(DEFAULT_SCHEME);
};
},{"./base-request":98}],98:[function(require,module,exports){
'use strict';

var Request = function(builder) {
  if (!builder) {
    throw new Error('No builder supplied to constructor');
  }

  this.host = builder.host;
  this.port = builder.port;
  this.scheme = builder.scheme;
  this.queryParameters = builder.queryParameters;
  this.bodyParameters = builder.bodyParameters;
  this.headers = builder.headers;
  this.path = builder.path;
};

Request.prototype.getHost = function() {
  return this.host;
};

Request.prototype.getPort = function() {
  return this.port;
};

Request.prototype.getScheme = function() {
  return this.scheme;
};

Request.prototype.getPath = function() {
  return this.path;
};

Request.prototype.getQueryParameters = function() {
  return this.queryParameters;
};

Request.prototype.getBodyParameters = function() {
  return this.bodyParameters;
};

Request.prototype.getHeaders = function() {
  return this.headers;
};

Request.prototype.getURI = function() {
  if (!this.scheme || !this.host || !this.port) {
    throw new Error('Missing components necessary to construct URI');
  }
  var uri = this.scheme + '://' + this.host;
  if (this.scheme === 'http' && this.port !== 80 ||
    this.scheme === 'https' && this.port !== 443) {
    uri += ':' + this.port;
  }
  if (this.path) {
    uri += this.path;
  }
  return uri;
};

Request.prototype.getURL = function() {
  var uri = this.getURI();
  if (this.getQueryParameters()) {
    return uri + this.getQueryParameterString(this.getQueryParameters());
  } else {
    return uri;
  }
};

Request.prototype.addQueryParameters = function(queryParameters) {
  for (var key in queryParameters) {
    this.addQueryParameter(key, queryParameters[key]);
  }
};

Request.prototype.addQueryParameter = function(key, value) {
  if (!this.queryParameters) {
    this.queryParameters = {};
  }
  this.queryParameters[key] = value;
};

Request.prototype.addBodyParameters = function(bodyParameters) {
  for (var key in bodyParameters) {
    this.addBodyParameter(key, bodyParameters[key]);
  }
};

Request.prototype.addBodyParameter = function(key, value) {
  if (!this.bodyParameters) {
    this.bodyParameters = {};
  }
  this.bodyParameters[key] = value;
};

Request.prototype.addHeaders = function(headers) {
  if (!this.headers) {
    this.headers = headers;
  } else {
    for (var key in headers) {
      this.headers[key] = headers[key];
    }
  }
};

Request.prototype.getQueryParameterString = function() {
  var queryParameters = this.getQueryParameters();
  if (!queryParameters) {
    return;
  }
  var queryParameterString = '?';
  var first = true;
  for (var key in queryParameters) {
    if (queryParameters.hasOwnProperty(key)) {
      if (!first) {
        queryParameterString += '&';
      } else {
        first = false;
      }
      queryParameterString += key + '=' + queryParameters[key];
    }
  }
  return queryParameterString;
};

var Builder = function() {
  var host, port, scheme, queryParameters, bodyParameters, headers, jsonBody;
};

Builder.prototype.withHost = function(host) {
  this.host = host;
  return this;
};

Builder.prototype.withPort = function(port) {
  this.port = port;
  return this;
};

Builder.prototype.withScheme = function(scheme) {
  this.scheme = scheme;
  return this;
};

Builder.prototype.withQueryParameters = function(queryParameters) {
  this.queryParameters = queryParameters;
  return this;
};

Builder.prototype.withPath = function(path) {
  this.path = path;
  return this;
};

Builder.prototype.withBodyParameters = function(bodyParameters) {
  this.bodyParameters = bodyParameters;
  return this;
};

Builder.prototype.withHeaders = function(headers) {
  this.headers = headers;
  return this;
};

Builder.prototype.build = function() {
  return new Request(this);
};

module.exports.builder = function() {
  return new Builder();
};

},{}],99:[function(require,module,exports){
'use strict';

var restler = require('restler'),
    WebApiError = require('./webapi-error');

var HttpManager = {};

/* Create restler options from the base request */
var _getParametersFromRequest = function(request) {

  var options = {};

  if (request.getQueryParameters()) {
    options.query = request.getQueryParameters();
  }

  if (request.getHeaders() &&
      request.getHeaders()['Content-Type'] === 'application/json') {
    options.data = JSON.stringify(request.getBodyParameters());
  } else if (request.getBodyParameters()) {
    options.data = request.getBodyParameters();
  }

  if (request.getHeaders()) {
    options.headers = request.getHeaders();
  }
  return options;
};

/* Create an error object from an error returned from the Web API */
var _getErrorObject = function(defaultMessage, err) {
  var errorObject;
  if (typeof err.error === 'object' && typeof err.error.message === 'string') {
    // Web API Error format
    errorObject = new WebApiError(err.error.message, err.error.status);
  } else if (typeof err.error === 'string') {
    // Authorization Error format
    /* jshint ignore:start */
    errorObject = new WebApiError(err.error + ': ' + err['error_description']);
    /* jshint ignore:end */
  } else if (typeof err === 'string') {
    // Serialized JSON error
    try {
      var parsedError = JSON.parse(err);
      errorObject = new WebApiError(parsedError.error.message, parsedError.error.status);
    } catch (err) { 
      // Error not JSON formatted
    }
  }

  if(!errorObject) {
    // Unexpected format
    errorObject = new WebApiError(defaultMessage + ': ' + JSON.stringify(err));
  }

  return errorObject;
};

/* Make the request to the Web API */
HttpManager._makeRequest = function(method, options, uri, callback) {

  method(uri, options)
    .on('success', function(data, response) {
      callback(null, { 'body' : data, 'headers': response.headers, 'statusCode' : response.statusCode });
    })
    .on('fail', function(err, response) {
      if (err) {
        var errorObject = _getErrorObject('Request failed', err);
        callback(errorObject);
      } else {
        callback(new Error('Request failed'));
      }
    })
    .on('error', function(err, response) {
      if (err) {
        var errorObject = _getErrorObject('Request error', err);
        callback(errorObject);
      } else {
        callback(new Error('Request error'));
      }
    })
    .on('timeout', function(ms) {
      callback(new Error('Request timed out (' + ms + ')'));
    });
};

/**
 * Make a HTTP GET request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.get = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = restler.get;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP POST request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.post = function(request, callback) {

  var options = _getParametersFromRequest(request);
  var method = restler.post;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP DELETE request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.del = function(request, callback) {

  var options = _getParametersFromRequest(request);
  var method = restler.del;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP PUT request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.put = function(request, callback) {

  var options = _getParametersFromRequest(request);
  var method = restler.put;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

module.exports = HttpManager;

},{"./webapi-error":101,"restler":63}],100:[function(require,module,exports){
(function (Buffer){
'use strict';

var AuthenticationRequest = require('./authentication-request'),
    WebApiRequest = require('./webapi-request'),
    HttpManager = require('./http-manager'),
    PromiseImpl = require('promise');

function SpotifyWebApi(credentials) {

  var _credentials = credentials || {};

  function _addBodyParameters(request, options) {
    if (options) {
      for (var key in options) {
        if (key !== 'credentials') {
          request.addBodyParameter(key, options[key]);
        }
      }
    }
  }

  function _addQueryParameters(request, options) {
    if (!options) {
      return;
    }
    for (var key in options) {
      if (key !== 'credentials') {
        request.addQueryParameter(key, options[key]);
      }
    }
  }

  function _performRequest(method, request) {
    var promiseFunction = function(resolve, reject) {
      method(request, function(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    };
    return new PromiseImpl(promiseFunction);
  }

  function _addAccessToken(request, accessToken) {
    if (accessToken) {
      request.addHeaders({
        'Authorization' : 'Bearer ' + accessToken
      });
    }
  }

  this.setCredentials = function(credentials) {
    for (var key in credentials) {
      if (credentials.hasOwnProperty(key)) {
        _credentials[key] = credentials[key];
      }
    }
  };

  this.getCredentials = function() {
    return _credentials;
  };

  this.resetCredentials = function() {
    _credentials = null;
  };

  this.setClientId = function(clientId) {
    _setCredential('clientId', clientId);
  };

  this.setClientSecret = function(clientSecret) {
    _setCredential('clientSecret', clientSecret);
  };

  this.setAccessToken = function(accessToken) {
    _setCredential('accessToken', accessToken);
  };

  this.setRefreshToken = function(refreshToken) {
    _setCredential('refreshToken', refreshToken);
  };

  this.setRedirectURI = function(redirectUri) {
    _setCredential('redirectUri', redirectUri);
  };

  this.getRedirectURI = function() {
    return _getCredential('redirectUri');
  };

  this.getClientId = function() {
    return _getCredential('clientId');
  };

  this.getClientSecret = function() {
    return _getCredential('clientSecret');
  };

  this.getAccessToken = function() {
    return _getCredential('accessToken');
  };

  this.getRefreshToken = function() {
    return _getCredential('refreshToken');
  };

  this.resetClientId = function() {
    _resetCredential('clientId');
  };

  this.resetClientSecret = function() {
    _resetCredential('clientSecret');
  };

  this.resetAccessToken = function() {
    _resetCredential('accessToken');
  };

  this.resetRefreshToken = function() {
    _resetCredential('refreshToken');
  };

  this.resetRedirectURI = function() {
    _resetCredential('redirectUri');
  };

  function _setCredential(credentialKey, value) {
    _credentials = _credentials || {};
    _credentials[credentialKey] = value;
  }

  function _getCredential(credentialKey) {
    if (!_credentials) {
      return;
    } else {
      return _credentials[credentialKey];
    }
  }

  function _resetCredential(credentialKey) {
    if (!_credentials) {
      return;
    } else {
      _credentials[credentialKey] = null;
    }
  }

  /**
   * Look up a track.
   * @param {string} trackId The track's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getTrack('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the track. Not returned if a callback is given.
   */
  this.getTrack = function(trackId, options, callback) {
     // In case someone is using a version where options parameter did not exist.
    var actualCallback;
    if (typeof options === 'function') {
      actualCallback = options;
    } else {
      actualCallback = callback;
    }

    var actualOptions = {};
    if (typeof options === 'object') {
      Object.keys(options).forEach(function(key) {
        actualOptions[key] = options[key];
      });
    }

    var request = WebApiRequest.builder()
      .withPath('/v1/tracks/' + trackId)
      .withQueryParameters(actualOptions)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (actualCallback) {
      promise.then(function(data) {
        actualCallback(null, data);
      }, function(err) {
        actualCallback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Look up several tracks.
   * @param {string[]} trackIds The IDs of the artists.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  this.getTracks = function(trackIds, options, callback) {
    // In case someone is using a version where options parameter did not exist.
    var actualCallback;
    if (typeof options === 'function') {
      actualCallback = options;
    } else {
      actualCallback = callback;
    }

    var actualOptions = {};
    if (typeof options === 'object') {
      Object.keys(options).forEach(function(key) {
        actualOptions[key] = options[key];
      });
    }

    var request = WebApiRequest.builder()
      .withPath('/v1/tracks')
      .withQueryParameters({
        'ids' : trackIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, actualOptions);

    var promise = _performRequest(HttpManager.get, request);

    if (actualCallback) {
      promise.then(function(data) {
        actualCallback(null, data);
      }, function(err) {
        actualCallback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Look up an album.
   * @param {string} albumId The album's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbum('0sNOF9WDwhWunNAHPD3Baj').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the album. Not returned if a callback is given.
   */
  this.getAlbum = function(albumId, options, callback) {
    // In case someone is using a version where options parameter did not exist.
    var actualCallback;
    if (typeof options === 'function') {
      actualCallback = options;
    } else {
      actualCallback = callback;
    }

    var actualOptions = {};
    if (typeof options === 'object') {
      Object.keys(options).forEach(function(key) {
        actualOptions[key] = options[key];
      });
    }

    var request = WebApiRequest.builder()
      .withPath('/v1/albums/' + albumId)
      .withQueryParameters(actualOptions)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (actualCallback) {
      promise.then(function(data) {
        actualCallback(null, data);
      }, function(err) {
        actualCallback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Look up several albums.
   * @param {string[]} artistIds The IDs of the artists.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  this.getAlbums = function(albumIds, options, callback) {
    // In case someone is using a version where options parameter did not exist.
    var actualCallback;
    if (typeof options === 'function') {
      actualCallback = options;
    } else {
      actualCallback = callback;
    }

    var actualOptions = {};
    if (typeof options === 'object') {
      Object.keys(options).forEach(function(key) {
        actualOptions[key] = options[key];
      });
    }

    var request = WebApiRequest.builder()
      .withPath('/v1/albums')
      .withQueryParameters({
        'ids' : albumIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, actualOptions);

    var promise = _performRequest(HttpManager.get, request);

    if (actualCallback) {
      promise.then(function(data) {
        actualCallback(null, data);
      }, function(err) {
        actualCallback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Look up an artist.
   * @param {string} artistId The artist's ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example api.getArtist('1u7kkVrr14iBvrpYnZILJR').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artist. Not returned if a callback is given.
   */
  this.getArtist = function(artistId, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/artists/' + artistId)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Look up several artists.
   * @param {string[]} artistIds The IDs of the artists.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  this.getArtists = function(artistIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/artists')
      .withQueryParameters({
        'ids' : artistIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Search for music entities of certain types.
   * @param {string} query The search query.
   * @param {string[]} types An array of item types to search across.
   * Valid types are: 'album', 'artist', 'playlist', and 'track'.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example search('Abba', ['track', 'playlist'], { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.search = function(query, types, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/search/')
      .withQueryParameters({
        type : types.join(','),
        q : query
      })
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Search for an album.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchAlbums('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.searchAlbums = function(query, options, callback) {
    return this.search(query, ['album'], options, callback);
  };

  /**
   * Search for an artist.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchArtists('David Bowie', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.searchArtists = function(query, options, callback) {
    return this.search(query, ['artist'], options, callback);
  };

  /**
   * Search for a track.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchTracks('Mr. Brightside', { limit : 3, offset : 2 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.searchTracks = function(query, options, callback) {
    return this.search(query, ['track'], options, callback);
  };

  /**
   * Search for playlists.
   * @param {string} query The search query.
   * @param {Object} options The possible options.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchPlaylists('workout', { limit : 1, offset : 0 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.searchPlaylists = function(query, options, callback) {
    return this.search(query, ['playlist'], options, callback);
  };

  /**
   * Get an artist's albums.
   * @param {string} artistId The artist's ID.
   * @options {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistAlbums('0oSGxfWSnnOXhD2fKuz2Gy', { album_type : 'album', country : 'GB', limit : 2, offset : 5 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the albums
   *          for the given artist. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.getArtistAlbums = function(artistId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/artists/' + artistId + '/albums')
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get the tracks of an album.
   * @param albumId the album's ID.
   * @options {Object} [options] The possible options, e.g. limit.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbumTracks('41MnTivkwTO3UUJ8DrqEJJ', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *                    tracks in the album. The result is paginated. If the promise is rejected.
   *                    it contains an error object. Not returned if a callback is given.
   */
  this.getAlbumTracks = function(albumId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/albums/' + albumId + '/tracks')
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get an artist's top tracks.
   * @param {string} artistId The artist's ID.
   * @param {string} country The country/territory where the tracks are most popular. (format: ISO 3166-1 alpha-2)
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistTopTracks('0oSGxfWSnnOXhD2fKuz2Gy', 'GB').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          artist's top tracks in the given country. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.getArtistTopTracks = function(artistId, country, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/artists/' + artistId + '/top-tracks')
      .withQueryParameters({
        'country' : country
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get related artists.
   * @param {string} artistId The artist's ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistRelatedArtists('0oSGxfWSnnOXhD2fKuz2Gy').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          related artists. If the promise is rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getArtistRelatedArtists = function(artistId, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/artists/' + artistId + '/related-artists')
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get information about a user.
   * @param userId The user ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getUser('thelinmichael').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the user. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getUser = function(userId, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId))
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get information about the user that has signed in (the current user).
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getMe().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the user. The amount of information
   *          depends on the permissions given by the user. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getMe = function(callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me')
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get a user's playlists.
   * @param {string} userId The user ID.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getUserPlaylists('thelinmichael').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of playlists. If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getUserPlaylists = function(userId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists')
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get a playlist.
   * @param {string} userId The playlist's owner's user ID.
   * @param {string} playlistId The playlist's ID.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getPlaylist('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          the playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getPlaylist = function(userId, playlistId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId)
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get tracks in a playlist.
   * @param {string} userId THe playlist's owner's user ID.
   * @param {string} playlistId The playlist's ID.
   * @param {Object} [options] Optional options, such as fields.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getPlaylistTracks('thelinmichael', '3ktAYNcRHpazJ9qecm3ptn').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object that containing
   * the tracks in the playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getPlaylistTracks = function(userId, playlistId, options, callback) {
    var request = WebApiRequest.builder().
      withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/tracks').
      withQueryParameters(options).
      build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Create a playlist.
   * @param {string} userId The playlist's owner's user ID.
   * @param {string} playlistName The name of the playlist.
   * @param {Object} [options] The possible options, currently only public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example createPlaylist('thelinmichael', 'My cool playlist!', { public : false }).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing information about the
   *          created playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.createPlaylist = function(userId, playlistName, options, callback) {
    // In case someone is using a version where options parameter did not exist.
    var actualCallback;
    if (typeof options === 'function') {
      actualCallback = options;
    } else {
      actualCallback = callback;
    }

    var actualOptions = { 'name' : playlistName };
    if (typeof options === 'object') {
      Object.keys(options).forEach(function(key) {
        actualOptions[key] = options[key];
      });
    }

    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withBodyParameters(actualOptions)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.post, request);

    if (actualCallback) {
      promise.then(function(data) {
        actualCallback(null, data);
      }, function(err) {
        actualCallback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Follow a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, currently only public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.followPlaylist = function(userId, playlistId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/followers')
      .withBodyParameters(options)
      .withHeaders({ 'Content-Type' : 'application/json' })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Unfollow a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, currently only public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.unfollowPlaylist = function(userId, playlistId, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/followers')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Change playlist details.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, e.g. name, public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example changePlaylistDetails('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK', {name: 'New name', public: true}).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.changePlaylistDetails = function(userId, playlistId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId)
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withBodyParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Add tracks to a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {string[]} tracks IDs of the tracks to add to the playlist.
   * @param {Object} [options] Options, position being the only one.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example addTracksToPlaylist('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK',
              '["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]').then(...)
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.addTracksToPlaylist = function(userId, playlistId, tracks, options, callback) {
    var tracksString;
    if (typeof tracks === 'object') {
      tracksString = tracks.join();
    } else {
      tracksString = tracks;
    }
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withQueryParameters({
        uris: tracksString
      })
      .build();

    _addQueryParameters(request, options);
    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.post, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Remove tracks from a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {Object[]} tracks An array of objects containing a property called uri with the track URI (String), and
   * a an optional property called positions (int[]), e.g. { uri : "spotify:track:491rM2JN8KvmV6p0oDDuJT", positions : [0, 15] }
   * @param {Object} options Options, snapshot_id being the only one.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.removeTracksFromPlaylist = function(userId, playlistId, tracks, options, callback) {
    var request = WebApiRequest.builder().
      withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/tracks').
      withHeaders({ 'Content-Type' : 'application/json' }).
      withBodyParameters({
        'tracks': tracks
      }).
      build();

    _addBodyParameters(request, options);
    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Remove tracks from a playlist by position instead of specifying the tracks' URIs.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {int[]} positions The positions of the tracks in the playlist that should be removed
   * @param {string} snapshot_id The snapshot ID, or version, of the playlist. Required
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.removeTracksFromPlaylistByPosition = function(userId, playlistId, positions, snapshotId, callback) {
    var request = WebApiRequest.builder().
      withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/tracks').
      withHeaders({ 'Content-Type' : 'application/json' }).
      withBodyParameters({
        'positions': positions,
        'snapshot_id' : snapshotId
      }).
      build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Replace tracks in a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {Object[]} uris An array of track URIs (strings)
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.replaceTracksInPlaylist = function(userId, playlistId, uris, callback) {
    var request = WebApiRequest.builder().
      withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/tracks').
      withHeaders({ 'Content-Type' : 'application/json' }).
      withBodyParameters({
        'uris': uris
      }).
      build();

    _addAccessToken(request, this.getAccessToken());

    var promise =  _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Reorder tracks in a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {int} rangeStart The position of the first track to be reordered.
   * @param {int} insertBefore The position where the tracks should be inserted.
   * @param {Object} options Optional parameters, i.e. range_length and snapshot_id.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.reorderTracksInPlaylist = function(userId, playlistId, rangeStart, insertBefore, options, callback) {
    var request = WebApiRequest.builder().
      withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/tracks').
      withHeaders({ 'Content-Type' : 'application/json' }).
      withBodyParameters({
        'range_start': rangeStart,
        'insert_before' : insertBefore
      }).
      build();

    _addAccessToken(request, this.getAccessToken());
    _addBodyParameters(request, options);

    var promise =  _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get audio features for a single track identified by its unique Spotify ID.
   * @param {string} trackId The track ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioFeaturesForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio features. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getAudioFeaturesForTrack = function(trackId, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/audio-features/' + trackId)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get audio features for multiple tracks identified by their unique Spotify ID.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioFeaturesForTracks(['38P3Q4QcdjQALGF2Z92BmR', '2HO2bnoMrpnZUbUqiilLHi']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio features for the tracks. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getAudioFeaturesForTracks = function(trackIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/audio-features')
      .withQueryParameters({
        'ids' : trackIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Create a playlist-style listening experience based on seed artists, tracks and genres.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getRecommendations({ min_energy: 0.4, seed_artists: ['6mfK6Q2tzLMEchAr0e9Uzu', '4DYFVNKZ1uixa6SQTvzQwJ'], min_popularity: 50 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of tracks and a list of seeds. If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getRecommendations = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/recommendations')
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve a list of available genres seed parameter values for recommendations.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAvailableGenreSeeds().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of available genres to be used as seeds for recommendations.
   *          If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.getAvailableGenreSeeds = function(callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/recommendations/available-genre-seeds')
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Request an access token using the Client Credentials flow.
   * Requires that client ID and client secret has been set previous to the call.
   * @param {Object} options Options.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an object containing the access token,
   *          token type and time to expiration. If rejected, it contains an error object. Not returned if a callback is given.
   */
  this.clientCredentialsGrant = function(options, callback) {
    var request = AuthenticationRequest.builder()
      .withPath('/api/token')
      .withBodyParameters({
        'grant_type' : 'client_credentials'
      })
      .withHeaders({
        Authorization : ('Basic ' + new Buffer(this.getClientId() + ':' + this.getClientSecret()).toString('base64'))
      })
      .build();

    _addBodyParameters(request, options);

    var promise =  _performRequest(HttpManager.post, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Request an access token using the Authorization Code flow.
   * Requires that client ID, client secret, and redirect URI has been set previous to the call.
   * @param {string} code The authorization code returned in the callback in the Authorization Code flow.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an object containing the access token,
   *          refresh token, token type and time to expiration. If rejected, it contains an error object.
   *          Not returned if a callback is given.
   */
  this.authorizationCodeGrant = function(code, callback) {
    var request = AuthenticationRequest.builder()
      .withPath('/api/token')
      .withBodyParameters({
        'grant_type' : 'authorization_code',
        'redirect_uri' : this.getRedirectURI(),
        'code' : code,
        'client_id' : this.getClientId(),
        'client_secret' : this.getClientSecret()
      })
      .build();

    var promise = _performRequest(HttpManager.post, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Refresh the access token given that it hasn't expired.
   * Requires that client ID, client secret and refresh token has been set previous to the call.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing the
   *          access token, time to expiration and token type. If rejected, it contains an error object.
   *          Not returned if a callback is given.
   */
  this.refreshAccessToken = function(callback) {
    var request = AuthenticationRequest.builder()
      .withPath('/api/token')
      .withBodyParameters({
        'grant_type' : 'refresh_token',
        'refresh_token' : this.getRefreshToken()
      })
      .withHeaders({
        Authorization : ('Basic ' + new Buffer(this.getClientId() + ':' + this.getClientSecret()).toString('base64'))
      })
      .build();

    var promise = _performRequest(HttpManager.post, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve a URL where the user can give the application permissions.
   * @param {string[]} scopes The scopes corresponding to the permissions the application needs.
   * @param {string} state A parameter that you can use to maintain a value between the request and the callback to redirect_uri.It is useful to prevent CSRF exploits.
   * @returns {string} The URL where the user can give application permissions.
   */
  this.createAuthorizeURL = function(scopes, state) {
    var request = AuthenticationRequest.builder()
      .withPath('/authorize')
      .withQueryParameters({
        'client_id' : this.getClientId(),
        'response_type' : 'code',
        'redirect_uri' : this.getRedirectURI(),
        'scope' : scopes.join('%20'),
        'state' : state
      })
      .build();

    return request.getURL();
  };

  /**
   * Retrieve the tracks that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist track objects. Not returned if a callback is given.
   */
  this.getMySavedTracks = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/tracks')
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Check if one or more tracks is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the track ID in the request.
   * The boolean value of true indicates that the track is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  this.containsMySavedTracks = function(trackIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/tracks/contains')
      .withQueryParameters({
        'ids' : trackIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Remove a track from the authenticated user's Your Music library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  this.removeFromMySavedTracks = function(trackIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/tracks')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withBodyParameters(trackIds)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

   /**
   * Add a track from the authenticated user's Your Music library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  this.addToMySavedTracks = function(trackIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/tracks')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withBodyParameters(trackIds)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Remove an album from the authenticated user's Your Music library.
   * @param {string[]} albumIds The album IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  this.removeFromMySavedAlbums = function(albumIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/albums')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withBodyParameters(albumIds)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Add an album from the authenticated user's Your Music library.
   * @param {string[]} albumIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  this.addToMySavedAlbums = function(albumIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/albums')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withBodyParameters(albumIds)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve the albums that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist album objects. Not returned if a callback is given.
   */
  this.getMySavedAlbums = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/albums')
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Check if one or more albums is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} albumIds The album IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the album ID in the request.
   * The boolean value of true indicates that the album is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  this.containsMySavedAlbums = function(albumIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/albums/contains')
      .withQueryParameters({
        'ids' : albumIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get the current user's top artists based on calculated affinity.
   * @param {Object} [options] Options, being time_range, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of artists,
   *          otherwise an error. Not returned if a callback is given.
   */
  this.getMyTopArtists = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/top/artists')
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get the current user's top tracks based on calculated affinity.
   * @param {Object} [options] Options, being time_range, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  this.getMyTopTracks = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/top/tracks')
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Add the current user as a follower of one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to be followed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example followUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.followUsers = function(userIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Add the current user as a follower of one or more artists.
   * @param {string[]} artistIds The IDs of the artists to be followed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example followArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.followArtists = function(artistIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.put, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Remove the current user as a follower of one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to be unfollowed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example unfollowUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.unfollowUsers = function(userIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Remove the current user as a follower of one or more artists.
   * @param {string[]} artistIds The IDs of the artists to be unfollowed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example unfollowArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  this.unfollowArtists = function(artistIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.del, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Check to see if the current user is following one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to check if are followed by the current user.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example isFollowingUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   *          of the returned array's elements correspond to the users IDs in the request.
   *          The boolean value of true indicates that the user is following that user, otherwise is not.
   *          Not returned if a callback is given.
   */
  this.isFollowingUsers = function(userIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following/contains')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Get the current user's followed artists.
   * @param {Object} [options] Options, being after and limit.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * album objects. Not returned if a callback is given.
   */
  this.getFollowedArtists = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withQueryParameters({
        type : 'artist'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());
    _addQueryParameters(request, options);

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };


  /**
   * Check if users are following a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {String[]} User IDs of the following users
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an array of booleans. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  this.areFollowingPlaylist = function(userId, playlistId, followerIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/users/' + encodeURI(userId) + '/playlists/' + playlistId + '/followers/contains')
      .withQueryParameters({
        ids : followerIds.join(',')
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Check to see if the current user is following one or more artists.
   * @param {string[]} artistIds The IDs of the artists to check if are followed by the current user.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example isFollowingArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   *          of the returned array's elements correspond to the artists IDs in the request.
   *          The boolean value of true indicates that the user is following that artist, otherwise is not.
   *          Not returned if a callback is given.
   */
  this.isFollowingArtists = function(artistIds, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/me/following/contains')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve new releases
   * @param {Object} [options] Options, being country, limit and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * album objects. Not returned if a callback is given.
   */
  this.getNewReleases = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/browse/new-releases')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve featured playlists
   * @param {Object} [options] Options, being country, locale, timestamp, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * featured playlists. Not returned if a callback is given.
   */
  this.getFeaturedPlaylists = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/browse/featured-playlists')
      .withHeaders({ 'Content-Type' : 'application/json' })
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise =  _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve a list of categories used to tag items in Spotify (e.g. in the 'Browse' tab)
   * @param {Object} [options] Options, being country, locale, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object of categories.
   * Not returned if a callback is given.
   */
  this.getCategories = function(options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/browse/categories')
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve a category.
   * @param {string} categoryId The id of the category to retrieve.
   * @param {Object} [options] Options, being country, locale.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a category object.
   * Not returned if a callback is given.
   */
  this.getCategory = function(categoryId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/browse/categories/' + categoryId)
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

  /**
   * Retrieve playlists for a category.
   * @param {string} categoryId The id of the category to retrieve playlists for.
   * @param {Object} [options] Options, being country, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to a paging object containing simple playlists.
   * Not returned if a callback is given.
   */
  this.getPlaylistsForCategory = function(categoryId, options, callback) {
    var request = WebApiRequest.builder()
      .withPath('/v1/browse/categories/' + categoryId + '/playlists')
      .withQueryParameters(options)
      .build();

    _addAccessToken(request, this.getAccessToken());

    var promise = _performRequest(HttpManager.get, request);

    if (callback) {
      promise.then(function(data) {
        callback(null, data);
      }, function(err) {
        callback(err);
      });
    } else {
      return promise;
    }
  };

}

module.exports = SpotifyWebApi;

}).call(this,require("buffer").Buffer)
},{"./authentication-request":97,"./http-manager":99,"./webapi-request":102,"buffer":17,"promise":60}],101:[function(require,module,exports){
'use strict';

function WebapiError(message, statusCode) {
  this.name = 'WebapiError';
  this.message = (message || '');
  this.statusCode = statusCode;
}

WebapiError.prototype = Error.prototype;

module.exports = WebapiError;
},{}],102:[function(require,module,exports){
'use strict';

var Request = require('./base-request');

var DEFAULT_HOST = 'api.spotify.com',
    DEFAULT_PORT = 443,
    DEFAULT_SCHEME = 'https';

module.exports.builder = function() {
  return Request.builder()
      .withHost(DEFAULT_HOST)
      .withPort(DEFAULT_PORT)
      .withScheme(DEFAULT_SCHEME);
};
},{"./base-request":98}]},{},[58]);