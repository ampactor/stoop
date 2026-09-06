// ---------- identity ----------
// Authors are stored as stable keys ('a', 'b', 'both'), never as display
// names, so renaming a person leaves every past entry attached to them.
var STORAGE_KEY = 'stoop_data_v3';
var NAMES_KEY = 'stoop_names';
var AUTHOR_KEY = 'stoop_active_author';
var AUTHORS = ['a', 'b', 'both'];

var names = (function () {
  try {
    var raw = JSON.parse(localStorage.getItem(NAMES_KEY));
    if (raw && raw.a && raw.b) return { a: String(raw.a), b: String(raw.b) };
  } catch (e) {}
  return { a: 'Me', b: 'JJ' };
})();

var currentAuthor = localStorage.getItem(AUTHOR_KEY) || 'a';
if (AUTHORS.indexOf(currentAuthor) < 0) currentAuthor = 'a';

function saveNames() { try { localStorage.setItem(NAMES_KEY, JSON.stringify(names)); } catch (e) {} }
function nameOf(key) { return key === 'both' ? 'Both' : (names[key] || key); }

// ---------- helpers ----------
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function fmtDay(ts) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric' });
}
function fmtStamp(ts) {
  var d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._h);
  t._h = setTimeout(function () { t.style.display = 'none'; }, 2400);
}

// ---------- seed ----------
var seedTs = Date.now();
var defaultData = {
  logs: [
    { id: 'l1', author: 'a', tag: 'moment', text: 'First clean run of the workbench setup. Smooth edges on the steel cut.', ts: seedTs - 864e5 },
    { id: 'l2', author: 'b', tag: 'quote', text: '"The only way out is through, and the best way through is together."', ts: seedTs - 43e6 },
    { id: 'l3', author: 'both', tag: 'idea', text: 'Weekend road trip sketch: farm stand cider, thrift store run, back before sunset.', ts: seedTs - 6e6 }
  ],
  todos: [
    { id: 't1', cat: 'groceries', text: 'Coffee beans (dark roast)', done: false, ts: seedTs },
    { id: 't2', cat: 'house', text: 'Hang kitchen spice shelf', done: false, ts: seedTs },
    { id: 't3', cat: 'shared', text: 'Plan Friday dinner & movie', done: false, ts: seedTs },
    { id: 't4', cat: 'a', text: 'Oil the drill press & clamps', done: true, ts: seedTs },
    { id: 't5', cat: 'b', text: 'Pick up sketchbook paper', done: false, ts: seedTs }
  ],
  projects: [
    { id: 'p1', title: 'Backyard Herb Garden', desc: 'Raised cedar bed: basil, rosemary, thyme, cherry tomatoes. Drip irrigation line.', ts: seedTs },
    { id: 'p2', title: 'Zine Issue #01', desc: 'First dispatch of thoughts, photos, and project notes. 8-page, 1-sheet fold.', ts: seedTs }
  ],
  journal: [
    { id: 'j1', author: 'both', title: 'Sunday Morning Coffee & Quiet', body: 'Made pour-overs, sat on the porch while the sun came up over the street. Talked about where we want our time to go this autumn. Fewer distractions, more physical making.', ts: seedTs - 864e5 }
  ],
  press: null
};

// ---------- migration ----------
// v2 stored display names as authors and dates as pre-formatted strings.
var AUTHOR_MAP = { Suds: 'a', Partner: 'b', Together: 'both', Both: 'both' };

function migrate(data) {
  var fallback = Date.now();
  function fixAuthor(v) { return AUTHOR_MAP[v] || (AUTHORS.indexOf(v) >= 0 ? v : 'a'); }
  function fixTs(item) {
    if (typeof item.ts !== 'number') { item.ts = fallback; fallback -= 6e4; }
    return item;
  }
  (data.logs || []).forEach(function (l) { l.author = fixAuthor(l.author); fixTs(l); });
  (data.journal || []).forEach(function (j) { j.author = fixAuthor(j.author); fixTs(j); });
  (data.projects || []).forEach(fixTs);
  (data.todos || []).forEach(function (t) {
    if (AUTHOR_MAP[t.cat]) t.cat = AUTHOR_MAP[t.cat];
    fixTs(t);
  });
  return data;
}

// Accept anything shaped like a backup; fill in what is missing rather than
// rejecting the file, so a partial import cannot leave the app unrenderable.
function normalize(raw) {
  var out = {
    logs: Array.isArray(raw && raw.logs) ? raw.logs : [],
    todos: Array.isArray(raw && raw.todos) ? raw.todos : [],
    projects: Array.isArray(raw && raw.projects) ? raw.projects : [],
    journal: Array.isArray(raw && raw.journal) ? raw.journal : [],
    press: (raw && raw.press) || null
  };
  return migrate(out);
}

var state = (function () {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
    var old = localStorage.getItem('stoop_data_v2');
    if (old) { toast('Upgraded your notes from the older format'); return normalize(JSON.parse(old)); }
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultData));
})();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Could not save — device storage is full');
  }
}

// ---------- photo store ----------
// Photos live in IndexedDB (localStorage caps out around 5 MB); the state
// above holds only their ids. Everything is dithered to 1-bit on intake, so
// a full-page photo is tens of kilobytes and prints on any copier.
var PHOTO_DB = 'stoop_photos';
var PHOTO_STORE = 'photos';
var photoCache = {};

function openPhotoDb() {
  return new Promise(function (resolve, reject) {
    if (!window.indexedDB) { reject(new Error('no indexeddb')); return; }
    var req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains(PHOTO_STORE)) req.result.createObjectStore(PHOTO_STORE);
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

function photoTx(mode, fn) {
  return openPhotoDb().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(PHOTO_STORE, mode);
      var req = fn(tx.objectStore(PHOTO_STORE));
      tx.oncomplete = function () { resolve(req && req.result); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}

function photoPut(id, dataUrl) {
  photoCache[id] = dataUrl;
  return photoTx('readwrite', function (s) { return s.put(dataUrl, id); })
    .catch(function () { toast('Photo kept in memory only — storage unavailable'); });
}
function photoDel(id) {
  delete photoCache[id];
  return photoTx('readwrite', function (s) { return s.delete(id); }).catch(function () {});
}
function photoLoadAll() {
  return openPhotoDb().then(function (db) {
    return new Promise(function (resolve) {
      var tx = db.transaction(PHOTO_STORE, 'readonly');
      var store = tx.objectStore(PHOTO_STORE);
      var keys = store.getAllKeys();
      var vals = store.getAll();
      tx.oncomplete = function () {
        (keys.result || []).forEach(function (k, i) { photoCache[k] = vals.result[i]; });
        resolve();
      };
      tx.onerror = function () { resolve(); };
    });
  }).catch(function () {});
}

// Drop photo blobs no entry or zine panel points at any more.
function collectPhotoRefs() {
  var live = {};
  state.logs.forEach(function (l) { if (l.photo) live[l.photo] = 1; });
  if (state.press && state.press.panels) {
    state.press.panels.forEach(function (p) { if (p && p.photo) live[p.photo] = 1; });
  }
  return live;
}
function sweepPhotos() {
  var live = collectPhotoRefs();
  Object.keys(photoCache).forEach(function (id) { if (!live[id]) photoDel(id); });
}
