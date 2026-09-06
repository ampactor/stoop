// ---------- carrying the notebook between devices ----------
// Two people means two browsers, and a backup that replaces the other person's
// work is not a sync, it is a coin flip. Import merges by id and keeps the
// newer copy of anything held in both. Sending it both ways leaves the two
// devices agreeing, which is as much as a file on a thumb drive can promise.
var BACKUP_VERSION = 3;

function exportBackup() {
  var live = collectPhotoRefs();
  var photos = {};
  Object.keys(live).forEach(function (id) { if (photoCache[id]) photos[id] = photoCache[id]; });

  var payload = {
    version: BACKUP_VERSION,
    exported: new Date().toISOString(),
    names: names,
    logs: state.logs,
    todos: state.todos,
    projects: state.projects,
    journal: state.journal,
    press: state.press,
    photos: photos
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'stoop-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast('Backup downloaded — photos included');
}

function mergeList(mine, theirs) {
  var byId = {};
  mine.forEach(function (item) { byId[item.id] = item; });
  theirs.forEach(function (item) {
    if (!item || !item.id) return;
    var existing = byId[item.id];
    if (!existing || (item.ts || 0) > (existing.ts || 0)) byId[item.id] = item;
  });
  return Object.keys(byId).map(function (k) { return byId[k]; });
}

function importBackup(raw, mode) {
  var incoming = normalize(raw);
  var photos = (raw && raw.photos) || {};
  var added = 0;

  Object.keys(photos).forEach(function (id) {
    if (!photoCache[id]) { photoPut(id, photos[id]); added++; }
  });

  if (mode === 'replace') {
    state.logs = incoming.logs;
    state.todos = incoming.todos;
    state.projects = incoming.projects;
    state.journal = incoming.journal;
    state.press = incoming.press;
  } else {
    var before = state.logs.length + state.todos.length + state.projects.length + state.journal.length;
    state.logs = mergeList(state.logs, incoming.logs);
    state.todos = mergeList(state.todos, incoming.todos);
    state.projects = mergeList(state.projects, incoming.projects);
    state.journal = mergeList(state.journal, incoming.journal);
    if (incoming.press && (!state.press || (incoming.press.ts || 0) > (state.press.ts || 0))) {
      state.press = incoming.press;
    }
    var after = state.logs.length + state.todos.length + state.projects.length + state.journal.length;
    added = Math.max(0, after - before) + added;
  }

  if (raw && raw.names && raw.names.a && raw.names.b && mode === 'replace') {
    names = { a: String(raw.names.a), b: String(raw.names.b) };
    saveNames();
  }

  saveState();
  renderAll();
  var status = document.getElementById('importstatus');
  var msg = mode === 'replace'
    ? 'Replaced everything with the backup.'
    : 'Merged. ' + added + ' new item(s) came across.';
  if (status) status.textContent = msg;
  toast(msg);
}

function handleImportFile(file, mode) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var parsed;
    try {
      parsed = JSON.parse(e.target.result);
    } catch (err) {
      toast('That file is not readable JSON');
      return;
    }
    if (!parsed || typeof parsed !== 'object') { toast('That file is not a stoop backup'); return; }
    if (mode === 'replace' &&
      !confirm('Replace everything on this device with the backup? Merge is usually what you want.')) return;
    importBackup(parsed, mode);
  };
  reader.onerror = function () { toast('Could not read that file'); };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('Reset to sample data? Everything on this device will be replaced.')) return;
  state = JSON.parse(JSON.stringify(defaultData));
  saveState();
  sweepPhotos();
  renderAll();
  toast('Reset to defaults');
}

function saveNameFields() {
  var a = document.getElementById('namea');
  var b = document.getElementById('nameb');
  names.a = (a && a.value.trim()) || 'Me';
  names.b = (b && b.value.trim()) || 'Partner';
  saveNames();
  renderAll();
  toast('Names saved');
}
