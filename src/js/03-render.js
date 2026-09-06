var activeLogFilter = 'all';
var activeTodoFilter = 'all';

// Author-keyed chips and options carry the current names, so a rename in
// settings reaches every surface without touching stored entries.
function renderNames() {
  var el = document.getElementById('authorname');
  if (el) el.textContent = nameOf(currentAuthor);

  document.querySelectorAll('[data-namechip]').forEach(function (chip) {
    var key = chip.getAttribute('data-namechip');
    chip.textContent = nameOf(key);
  });
  document.querySelectorAll('[data-nameopt]').forEach(function (opt) {
    var key = opt.getAttribute('data-nameopt');
    opt.textContent = (opt.hasAttribute('data-pen') ? '✍ ' : '') + nameOf(key);
  });

  var a = document.getElementById('namea');
  var b = document.getElementById('nameb');
  if (a && document.activeElement !== a) a.value = names.a;
  if (b && document.activeElement !== b) b.value = names.b;

  var jAuth = document.getElementById('journalauthor');
  if (jAuth) jAuth.value = currentAuthor;
}

function toggleAuthor() {
  currentAuthor = AUTHORS[(AUTHORS.indexOf(currentAuthor) + 1) % AUTHORS.length];
  localStorage.setItem(AUTHOR_KEY, currentAuthor);
  renderNames();
  toast('Now writing as ' + nameOf(currentAuthor));
}

function photoTag(id, cls) {
  var src = photoCache[id];
  if (!src) return '';
  return '<img class="' + cls + '" src="' + esc(src) + '" alt="">';
}

// ---------- log ----------
function renderLogs() {
  var list = document.getElementById('loglist');
  if (!list) return;
  var rows = state.logs.slice().sort(function (x, y) { return y.ts - x.ts; })
    .filter(function (l) { return activeLogFilter === 'all' || l.author === activeLogFilter; });

  if (!rows.length) {
    list.innerHTML = '<div class="paper sub" style="text-align:center;">Nothing here yet.</div>';
    return;
  }
  list.innerHTML = rows.map(function (l) {
    return '<div class="log-card author-' + esc(l.author) + '">' +
      '<div class="log-meta"><span><span class="log-author">' + esc(nameOf(l.author)) +
      '</span> · <span class="tag cold">' + esc(l.tag) + '</span> · ' + esc(fmtStamp(l.ts)) + '</span>' +
      '<button class="log-del" data-dellog="' + esc(l.id) + '" title="Delete">✕</button></div>' +
      (l.photo ? photoTag(l.photo, 'log-photo') : '') +
      (l.text ? '<div class="log-body">' + esc(l.text) + '</div>' : '') +
      '</div>';
  }).join('');
}

function addLog(photoIds) {
  var inp = document.getElementById('loginput');
  var tag = document.getElementById('logtag');
  var ids = photoIds || [];
  var text = inp ? inp.value.trim() : '';
  if (!text && !ids.length) return;

  if (ids.length) {
    ids.forEach(function (pid, i) {
      state.logs.push({
        id: uid('l'), author: currentAuthor, tag: 'photo',
        text: i === 0 ? text : '', photo: pid, ts: Date.now() + i
      });
    });
  } else {
    state.logs.push({
      id: uid('l'), author: currentAuthor,
      tag: (tag && tag.value) || 'moment', text: text, ts: Date.now()
    });
  }
  if (inp) inp.value = '';
  saveState();
  renderLogs();
  toast(ids.length ? 'Added ' + ids.length + ' photo(s)' : 'Posted to log');
}

// ---------- todos ----------
function renderTodos() {
  var list = document.getElementById('todolist');
  if (!list) return;
  var rows = state.todos.filter(function (t) {
    return activeTodoFilter === 'all' || t.cat === activeTodoFilter;
  });
  if (!rows.length) {
    list.innerHTML = '<div class="sub" style="padding:1rem;text-align:center;">All caught up.</div>';
    return;
  }
  list.innerHTML = rows.map(function (t) {
    return '<div class="todo-item' + (t.done ? ' done' : '') + '">' +
      '<input type="checkbox" class="todo-check" data-toggletodo="' + esc(t.id) + '"' +
      (t.done ? ' checked' : '') + '>' +
      '<span class="todo-text">' + esc(t.text) + '</span>' +
      '<span class="todo-tag">' + esc(nameOf(t.cat)) + '</span>' +
      '<button class="log-del" data-deltodo="' + esc(t.id) + '">✕</button></div>';
  }).join('');
}

function addTodo() {
  var inp = document.getElementById('todoinput');
  var cat = document.getElementById('todocat');
  if (!inp || !inp.value.trim()) return;
  state.todos.unshift({
    id: uid('t'), cat: (cat && cat.value) || 'shared',
    text: inp.value.trim(), done: false, ts: Date.now()
  });
  inp.value = '';
  saveState();
  renderTodos();
}

function clearCompletedTodos() {
  state.todos = state.todos.filter(function (t) { return !t.done; });
  saveState();
  renderTodos();
  toast('Cleared completed items');
}

// ---------- projects ----------
function renderProjects() {
  var list = document.getElementById('projectlist');
  if (!list) return;
  if (!state.projects.length) {
    list.innerHTML = '<div class="sub" style="padding:1rem;">No active projects. Start one above.</div>';
    return;
  }
  list.innerHTML = state.projects.map(function (p) {
    return '<div class="project-card"><h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p>' +
      '<div class="project-card-foot"><span>Updated ' + esc(fmtDay(p.ts)) + '</span>' +
      '<button class="log-del" data-delproject="' + esc(p.id) + '">DELETE</button></div></div>';
  }).join('');
}

function addProject() {
  var t = document.getElementById('projecttitle');
  var d = document.getElementById('projectdesc');
  if (!t || !t.value.trim()) return;
  state.projects.unshift({
    id: uid('p'), title: t.value.trim(), desc: (d && d.value.trim()) || '', ts: Date.now()
  });
  t.value = '';
  if (d) d.value = '';
  saveState();
  renderProjects();
  toast('Created project');
}

// ---------- journal ----------
function renderJournal() {
  var list = document.getElementById('journallist');
  if (!list) return;
  if (!state.journal.length) {
    list.innerHTML = '<div class="paper sub" style="text-align:center;">No journal entries yet.</div>';
    return;
  }
  list.innerHTML = state.journal.slice().sort(function (x, y) { return y.ts - x.ts; })
    .map(function (j) {
      return '<div class="journal-card"><div class="journal-card-head"><h2>' + esc(j.title) + '</h2>' +
        '<span class="sub">' + esc(nameOf(j.author)) + ' · ' + esc(fmtDay(j.ts)) +
        ' <button class="log-del" data-deljournal="' + esc(j.id) + '">✕</button></span></div>' +
        '<div class="journal-card-body">' + esc(j.body) + '</div></div>';
    }).join('');
}

function addJournal() {
  var t = document.getElementById('journaltitle');
  var a = document.getElementById('journalauthor');
  var b = document.getElementById('journalbody');
  if (!t || !t.value.trim() || !b || !b.value.trim()) { toast('Needs a title and some words'); return; }
  state.journal.unshift({
    id: uid('j'), author: (a && a.value) || currentAuthor,
    title: t.value.trim(), body: b.value.trim(), ts: Date.now()
  });
  t.value = '';
  b.value = '';
  saveState();
  renderJournal();
  toast('Saved journal entry');
}

function renderAll() {
  renderNames();
  renderLogs();
  renderTodos();
  renderProjects();
  renderJournal();
  renderPress();
}
