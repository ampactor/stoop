// ---------- drawing the symbol ----------
// Function patterns, masking, and the penalty rules that choose between the
// eight masks. Split from the encoder above only to keep both files under the
// repo's line ceiling; together they are one concern.
var QR_MASKS = [
  function (i, j) { return (i + j) % 2 === 0; },
  function (i) { return i % 2 === 0; },
  function (i, j) { return j % 3 === 0; },
  function (i, j) { return (i + j) % 3 === 0; },
  function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; },
  function (i, j) { return (i * j) % 2 + (i * j) % 3 === 0; },
  function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 === 0; },
  function (i, j) { return ((i + j) % 2 + (i * j) % 3) % 2 === 0; }
];

function qrSkeleton(version) {
  var n = version * 4 + 17;
  var m = [], res = [];
  for (var i = 0; i < n; i++) { m.push(new Array(n).fill(0)); res.push(new Array(n).fill(0)); }

  function finder(r, c) {
    for (var dr = -1; dr <= 7; dr++) {
      for (var dc = -1; dc <= 7; dc++) {
        var rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        var on = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
          (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
          (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        m[rr][cc] = on ? 1 : 0;
        res[rr][cc] = 1;
      }
    }
  }
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);

  for (var t = 8; t < n - 8; t++) {
    m[6][t] = res[6][t] = m[t][6] = res[t][6] = 1;
    if (t % 2) { m[6][t] = 0; m[t][6] = 0; }
  }

  // Alignment patterns sit at every pairing of the centres except the three
  // that would land on a finder. They may overlap the timing pattern, and at
  // version 7 and up they do, so the test is the corner and not the reservation.
  var centers = QR_ALIGN[version];
  centers.forEach(function (r) {
    centers.forEach(function (c) {
      var corner = (r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6);
      if (corner) return;
      for (var dr = -2; dr <= 2; dr++) {
        for (var dc = -2; dc <= 2; dc++) {
          m[r + dr][c + dc] = (Math.max(Math.abs(dr), Math.abs(dc)) !== 1) ? 1 : 0;
          res[r + dr][c + dc] = 1;
        }
      }
    });
  });

  for (var f = 0; f < 9; f++) {
    if (f !== 6) { res[8][f] = 1; res[f][8] = 1; }
  }
  for (var g = 0; g < 8; g++) { res[8][n - 1 - g] = 1; res[n - 1 - g][8] = 1; }
  m[n - 8][8] = 1; res[n - 8][8] = 1;             // the dark module

  if (version >= 7) {
    var vinfo = qrVersionBits(version);
    for (var b = 0; b < 18; b++) {
      var bit = (vinfo >> b) & 1;
      var rr2 = Math.floor(b / 3), cc2 = b % 3;
      m[rr2][n - 11 + cc2] = bit; res[rr2][n - 11 + cc2] = 1;
      m[n - 11 + cc2][rr2] = bit; res[n - 11 + cc2][rr2] = 1;
    }
  }
  return { m: m, res: res, n: n };
}

function qrVersionBits(v) {
  var d = v << 12;
  for (var i = 0; i < 6; i++) {
    if (d & (1 << (17 - i))) d ^= 0x1f25 << (5 - i);
  }
  return (v << 12) | d;
}

function qrFormatBits(mask) {
  var data = (1 << 3) | mask;            // ECC level L is 01, then the mask
  var d = data << 10;
  for (var i = 0; i < 5; i++) {
    if (d & (1 << (14 - i))) d ^= 0x537 << (4 - i);
  }
  return ((data << 10) | d) ^ 0x5412;
}

function qrPenalty(m, n) {
  var score = 0, dark = 0, i, j, run, last;
  for (i = 0; i < n; i++) {
    for (var dir = 0; dir < 2; dir++) {
      run = 1; last = -1;
      for (j = 0; j < n; j++) {
        var v = dir ? m[j][i] : m[i][j];
        if (v === last) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else { run = 1; last = v; }
      }
    }
  }
  for (i = 0; i < n - 1; i++) {
    for (j = 0; j < n - 1; j++) {
      var s = m[i][j] + m[i][j + 1] + m[i + 1][j] + m[i + 1][j + 1];
      if (s === 0 || s === 4) score += 3;
    }
  }
  // Rule 3: the 1:1:3:1:1 finder ratio with four light modules on either
  // side, in both orientations. Missing the second orientation still yields a
  // scannable symbol but picks a worse mask, which is how this was caught.
  function finderLike(at) {
    var a = at(0), b = at(1), c = at(2), d = at(3), e = at(4), f = at(5),
      g = at(6), h = at(7), i2 = at(8), j2 = at(9), k2 = at(10);
    if (b || !e || f || !g || j2) return false;
    return (a && c && d && !h && !i2 && !k2) || (!a && !c && !d && h && i2 && k2);
  }
  for (i = 0; i < n; i++) {
    for (j = 0; j + 10 < n; j++) {
      var row = i, at = j;
      if (finderLike(function (k) { return m[row][at + k]; })) score += 40;
      if (finderLike(function (k) { return m[at + k][row]; })) score += 40;
    }
  }
  for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) dark++;
  score += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
  return score;
}

// The public call: a matrix of 0/1, smallest version that fits the text.
function qrMatrix(text) {
  var bytes = utf8Bytes(text), version = 0;
  for (var v = 1; v <= 10; v++) {
    var header = 4 + (v < 10 ? 8 : 16);
    if (bytes.length + Math.ceil(header / 8) <= qrCapacity(v)) { version = v; break; }
  }
  if (!version) return null;

  var words = qrCodewords(text, version);
  var sk = qrSkeleton(version), n = sk.n;
  var bits = [];
  words.forEach(function (w) { for (var i = 7; i >= 0; i--) bits.push((w >> i) & 1); });

  var idx = 0, up = true;
  for (var col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (var step = 0; step < n; step++) {
      var row = up ? n - 1 - step : step;
      for (var c = 0; c < 2; c++) {
        var cc = col - c;
        if (sk.res[row][cc]) continue;
        sk.m[row][cc] = idx < bits.length ? bits[idx] : 0;
        idx++;
      }
    }
    up = !up;
  }

  // Masks are scored with the format modules and the dark module blanked, so
  // that only what the mask actually controls is being judged. The winner then
  // gets its real format bits written in.
  function writeFormat(cand, mask, live) {
    var fmt = live ? qrFormatBits(mask) : 0;
    for (var b = 0; b < 15; b++) {
      var bit = live ? (fmt >> b) & 1 : 0;
      if (b < 6) { cand[b][8] = bit; } else if (b < 8) { cand[b + 1][8] = bit; } else { cand[n - 15 + b][8] = bit; }
      // Column 6 of row 8 is the timing pattern, so bit 8 steps over it to 7.
      if (b < 8) { cand[8][n - 1 - b] = bit; } else if (b < 9) { cand[8][7] = bit; } else { cand[8][14 - b] = bit; }
    }
    cand[n - 8][8] = live ? 1 : 0;
    if (version < 7) return;
    var vinfo = live ? qrVersionBits(version) : 0;
    for (var k = 0; k < 18; k++) {
      var vbit = live ? (vinfo >> k) & 1 : 0;
      var r = Math.floor(k / 3), c = k % 3;
      cand[r][n - 11 + c] = vbit;
      cand[n - 11 + c][r] = vbit;
    }
  }

  var best = null, bestMask = 0, bestScore = Infinity;
  for (var mask = 0; mask < 8; mask++) {
    var cand = sk.m.map(function (r) { return r.slice(); });
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        if (!sk.res[i][j] && QR_MASKS[mask](i, j)) cand[i][j] ^= 1;
      }
    }
    writeFormat(cand, mask, false);
    var sc = qrPenalty(cand, n);
    if (sc < bestScore) { bestScore = sc; bestMask = mask; best = cand; }
  }
  writeFormat(best, bestMask, true);
  return best;
}

// Matrix to a 1-bit PNG data URL, quiet zone included, no smoothing.
function qrDataUrl(text, scale) {
  var m = qrMatrix(text);
  if (!m) return '';
  var q = 4, n = m.length, px = scale || 4, size = (n + q * 2) * px;
  var cv = document.createElement('canvas');
  cv.width = cv.height = size;
  var ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      if (m[i][j]) ctx.fillRect((j + q) * px, (i + q) * px, px, px);
    }
  }
  return cv.toDataURL('image/png');
}
