// ---------- the code on the back cover ----------
// The printed issue carries its own address, so somebody who finds the paper
// can reach the archive. That means a QR encoder, and the zero-external-
// requests law means writing one rather than fetching one. Byte mode, error
// correction L, versions 1 through 10, which covers any address worth putting
// on a back cover.
//
// The matrix this produces is checked against an independent implementation
// in test/03-qr.js; a symbol that does not scan is a wrong address.

// GF(256) over the QR primitive polynomial, for Reed-Solomon.
var GF_EXP = new Uint8Array(512);
var GF_LOG = new Uint8Array(256);
(function () {
  var x = 1;
  for (var i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (var j = 255; j < 512; j++) GF_EXP[j] = GF_EXP[j - 255];
})();

function gfMul(a, b) { return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }

function rsGen(n) {
  var g = [1];
  for (var i = 0; i < n; i++) {
    g.push(0);
    for (var j = g.length - 1; j > 0; j--) g[j] ^= gfMul(g[j - 1], GF_EXP[i]);
  }
  return g;
}

function rsEncode(data, n) {
  var g = rsGen(n);
  var res = new Uint8Array(data.length + n);
  res.set(data);
  for (var i = 0; i < data.length; i++) {
    var c = res[i];
    if (!c) continue;
    for (var j = 0; j < g.length; j++) res[i + j] ^= gfMul(g[j], c);
  }
  return Array.prototype.slice.call(res, data.length);
}

// Per version at ECC level L: [total codewords, ecc per block, block sizes].
var QR_L = {
  1: [26, 7, [19]], 2: [44, 10, [34]], 3: [70, 15, [55]], 4: [100, 20, [80]],
  5: [134, 26, [108]], 6: [172, 18, [68, 68]], 7: [196, 20, [78, 78]],
  8: [242, 24, [97, 97]], 9: [292, 30, [116, 116]], 10: [346, 18, [68, 68, 69, 69]]
};
var QR_ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
};

function qrCapacity(v) { return QR_L[v][2].reduce(function (a, b) { return a + b; }, 0); }

function utf8Bytes(str) {
  var out = [], s = unescape(encodeURIComponent(str));
  for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  return out;
}

function qrBitStream(bytes, version) {
  var bits = [];
  function push(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
  push(4, 4);                                   // byte mode
  push(bytes.length, version < 10 ? 8 : 16);    // character count
  bytes.forEach(function (b) { push(b, 8); });

  var cap = qrCapacity(version) * 8;
  for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  var pad = [0xec, 0x11], p = 0;
  while (bits.length < cap) { push(pad[p++ % 2], 8); }

  var words = [];
  for (var i = 0; i < bits.length; i += 8) {
    var v = 0;
    for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    words.push(v);
  }
  return words;
}

// Split into blocks, encode each, then interleave data then ecc, per spec.
function qrCodewords(text, version) {
  var spec = QR_L[version];
  var words = qrBitStream(utf8Bytes(text), version);
  var blocks = [], eccs = [], at = 0;
  spec[2].forEach(function (size) {
    var block = words.slice(at, at + size);
    at += size;
    blocks.push(block);
    eccs.push(rsEncode(block, spec[1]));
  });

  var out = [], maxData = Math.max.apply(null, spec[2]);
  for (var i = 0; i < maxData; i++) {
    blocks.forEach(function (b) { if (i < b.length) out.push(b[i]); });
  }
  for (var k = 0; k < spec[1]; k++) {
    eccs.forEach(function (e) { out.push(e[k]); });
  }
  return out;
}
