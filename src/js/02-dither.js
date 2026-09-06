// ---------- the photo intake ----------
// DESIGN.md: "images ship dithered (1-bit and riso-grain, which is also the
// print bridge)". One pipeline serves both ends of that sentence: the screen
// gets the scene's aesthetic, and the printer gets pure black and white, which
// is the only thing a photocopier can honestly reproduce anyway.
var PHOTO_MAX_EDGE = 1000;
var PHOTO_CONTRAST = 1.15;

function readImage(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('not an image')); };
      img.src = reader.result;
    };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsDataURL(file);
  });
}

// Floyd–Steinberg: threshold each pixel, push the error to the neighbours that
// have not been decided yet. Grain instead of banding, and it survives a copier.
function ditherToBitmap(img) {
  var scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(img.width, img.height));
  var w = Math.max(1, Math.round(img.width * scale));
  var h = Math.max(1, Math.round(img.height * scale));

  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  var imageData = ctx.getImageData(0, 0, w, h);
  var d = imageData.data;
  var gray = new Float32Array(w * h);

  for (var i = 0; i < w * h; i++) {
    var lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    gray[i] = Math.max(0, Math.min(255, (lum - 128) * PHOTO_CONTRAST + 128));
  }

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var idx = y * w + x;
      var old = gray[idx];
      var next = old < 128 ? 0 : 255;
      var err = old - next;
      gray[idx] = next;
      if (x + 1 < w) gray[idx + 1] += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0) gray[idx + w - 1] += err * 3 / 16;
        gray[idx + w] += err * 5 / 16;
        if (x + 1 < w) gray[idx + w + 1] += err * 1 / 16;
      }
    }
  }

  for (var p = 0; p < w * h; p++) {
    var v = gray[p] < 128 ? 0 : 255;
    d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = v;
    d[p * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// Returns the new photo ids, in the order the files were chosen.
function intakePhotos(fileList) {
  var files = Array.prototype.slice.call(fileList).filter(function (f) {
    return /^image\//.test(f.type);
  });
  if (!files.length) return Promise.resolve([]);
  toast(files.length > 1 ? 'Dithering ' + files.length + ' photos…' : 'Dithering photo…');

  return files.reduce(function (chain, file) {
    return chain.then(function (ids) {
      return readImage(file)
        .then(function (img) {
          var id = uid('ph');
          return photoPut(id, ditherToBitmap(img)).then(function () { return ids.concat(id); });
        })
        .catch(function () { toast('Skipped a file that is not an image'); return ids; });
    });
  }, Promise.resolve([]));
}
