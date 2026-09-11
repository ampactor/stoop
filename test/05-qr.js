// The code on the back cover, checked against an independent implementation.
// A QR symbol either scans or it does not, and "looks about right" is not a
// test: the fixtures in qr-fixtures.json were produced by the `qrcode` Python
// library in byte mode at error correction L, and are compared module for
// module. Regenerate them only if the encoder's contract changes on purpose.
//
// The encoder lives inside the app's closure, so this drives it the way a
// reader does — set the scene's address, open the press, and read the symbol
// back off the printed page.
const path = require('path');
const fs = require('fs');

const APP = 'file://' + path.resolve(__dirname, '..', 'index.html');
const FIXTURES = JSON.parse(fs.readFileSync(path.join(__dirname, 'qr-fixtures.json'), 'utf8'));

// The sheet draws the symbol at three device pixels per module with a four
// module quiet zone; sampling the centre of each cell recovers the matrix.
function readSymbol() {
  const img = document.querySelector('.backcover .addr .qr');
  if (!img || !img.naturalWidth) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const px = 3, quiet = 4;
  const n = c.width / px - quiet * 2;
  if (n !== Math.floor(n)) return null;
  const rows = [];
  for (let i = 0; i < n; i++) {
    let row = '';
    for (let j = 0; j < n; j++) {
      const x = (j + quiet) * px + 1;
      const y = (i + quiet) * px + 1;
      row += d[(y * c.width + x) * 4] < 128 ? '1' : '0';
    }
    rows.push(row);
  }
  return rows;
}

module.exports = async function qr(browser, ok) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.goto(APP);
  await page.waitForTimeout(600);

  for (const [url, fixture] of Object.entries(FIXTURES)) {
    const version = (fixture.matrix.length - 17) / 4;
    await page.evaluate(() => { location.hash = '#backup'; });
    await page.waitForTimeout(250);
    await page.fill('#addressinput', fixture.address);
    await page.click('#savenamesbtn2');
    await page.waitForTimeout(250);
    await page.evaluate(() => { location.hash = '#press'; });
    await page.waitForTimeout(500);

    const got = await page.evaluate(readSymbol);
    const want = fixture.matrix;
    if (!got) {
      ok('v' + version + ' symbol renders', false, 'no symbol on the back cover for ' + url);
      continue;
    }
    if (got.length !== want.length) {
      ok('v' + version + ' symbol is the right size', false, got.length + ' vs ' + want.length);
      continue;
    }
    let differ = 0;
    for (let i = 0; i < want.length; i++) {
      for (let j = 0; j < want.length; j++) if (got[i][j] !== want[i][j]) differ++;
    }
    ok('v' + version + ' (' + want.length + 'x' + want.length + ') matches the reference module for module',
       differ === 0, differ + ' modules differ');
  }

  ok('no script errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await ctx.close();
};
