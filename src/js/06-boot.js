// ---------- router ----------
var views = document.querySelectorAll('section[data-view]');
var navs = document.querySelectorAll('[data-nav]');

function showView() {
  var h = (location.hash || '#log').slice(1).split('/')[0];
  var hit = false;
  views.forEach(function (v) {
    var on = v.getAttribute('data-view') === h;
    v.classList.toggle('on', on);
    if (on) hit = true;
  });
  if (!hit) {
    h = 'log';
    views.forEach(function (v) { v.classList.toggle('on', v.getAttribute('data-view') === 'log'); });
  }
  navs.forEach(function (a) { a.classList.toggle('here', a.getAttribute('data-nav') === h); });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showView);

// ---------- events ----------
function hit(target, sel) { return target.closest ? target.closest(sel) : null; }

document.addEventListener('click', function (e) {
  var t = e.target;
  var el;

  // Arming a photo turns every panel into a drop target for one click.
  if ((el = hit(t, '[data-traypic]'))) { armPhoto(el.getAttribute('data-traypic')); return; }
  if (armedPhoto && (el = hit(t, '.panel'))) {
    e.preventDefault();
    if (placePhoto(Number(el.getAttribute('data-page')))) return;
  }
  if ((el = hit(t, '[data-delpanelpic]'))) {
    pressState().panels[Number(el.getAttribute('data-delpanelpic')) - 1].photo = null;
    savePress(); renderPress(); return;
  }

  if (hit(t, '#authortoggle')) return toggleAuthor();
  if (hit(t, '#logaddbtn')) return addLog();
  if (hit(t, '#photobtn')) return document.getElementById('photofile').click();
  if ((el = hit(t, '[data-dellog]'))) {
    var lid = el.getAttribute('data-dellog');
    state.logs = state.logs.filter(function (l) { return l.id !== lid; });
    saveState(); sweepPhotos(); renderLogs(); renderTray(); return;
  }
  if ((el = hit(t, '[data-logfilter]'))) {
    activeLogFilter = el.getAttribute('data-logfilter');
    document.querySelectorAll('[data-logfilter]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-logfilter') === activeLogFilter);
    });
    return renderLogs();
  }

  if (hit(t, '#todoaddbtn')) return addTodo();
  if ((el = hit(t, '[data-toggletodo]'))) {
    var item = state.todos.find(function (i) { return i.id === el.getAttribute('data-toggletodo'); });
    if (item) { item.done = el.checked; saveState(); renderTodos(); }
    return;
  }
  if ((el = hit(t, '[data-deltodo]'))) {
    var tid = el.getAttribute('data-deltodo');
    state.todos = state.todos.filter(function (i) { return i.id !== tid; });
    saveState(); return renderTodos();
  }
  if ((el = hit(t, '[data-todofilter]'))) {
    activeTodoFilter = el.getAttribute('data-todofilter');
    document.querySelectorAll('[data-todofilter]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-todofilter') === activeTodoFilter);
    });
    return renderTodos();
  }
  if (hit(t, '#clearcompletedbtn')) return clearCompletedTodos();

  if (hit(t, '#projectaddbtn')) return addProject();
  if ((el = hit(t, '[data-delproject]'))) {
    var pid = el.getAttribute('data-delproject');
    state.projects = state.projects.filter(function (p) { return p.id !== pid; });
    saveState(); return renderProjects();
  }

  if (hit(t, '#journaladdbtn')) return addJournal();
  if ((el = hit(t, '[data-deljournal]'))) {
    var jid = el.getAttribute('data-deljournal');
    state.journal = state.journal.filter(function (j) { return j.id !== jid; });
    saveState(); return renderJournal();
  }

  if (hit(t, '#compilezinebtn')) return compileZine();
  if (hit(t, '#printzinebtn')) { capturePanels(); return window.print(); }
  if (hit(t, '#clearzinebtn')) return clearSheet();
  if (hit(t, '#swaplayoutbtn')) return swapLayout();
  if (hit(t, '#testsheetbtn')) return toggleTestSheet();

  if (hit(t, '#exportbtn')) return exportBackup();
  if (hit(t, '#mergebtn')) { document.getElementById('importfile').dataset.mode = 'merge'; return document.getElementById('importfile').click(); }
  if (hit(t, '#replacebtn')) { document.getElementById('importfile').dataset.mode = 'replace'; return document.getElementById('importfile').click(); }
  if (hit(t, '#savenamesbtn')) return saveNameFields();
  if (hit(t, '#resetbtn')) return resetData();
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'loginput') { e.preventDefault(); addLog(); }
  else if (e.target.id === 'todoinput') { e.preventDefault(); addTodo(); }
  else if (e.target.id === 'namea' || e.target.id === 'nameb') { e.preventDefault(); saveNameFields(); }
});

// Panel edits save on a debounce so the caret is never yanked mid-word.
var panelTimer = null;
document.addEventListener('input', function (e) {
  if (!e.target.closest || !e.target.closest('#zinesheet')) return;
  clearTimeout(panelTimer);
  panelTimer = setTimeout(capturePanels, 400);
});
document.addEventListener('focusout', function (e) {
  if (e.target.closest && e.target.closest('#zinesheet')) capturePanels();
});

var photoInput = document.getElementById('photofile');
if (photoInput) {
  photoInput.addEventListener('change', function (e) {
    var files = e.target.files;
    if (!files || !files.length) return;
    intakePhotos(files).then(function (ids) {
      if (ids.length) addLog(ids);
      renderTray();
    });
    e.target.value = '';
  });
}

var importInput = document.getElementById('importfile');
if (importInput) {
  importInput.addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0], e.target.dataset.mode || 'merge');
    }
    e.target.value = '';
  });
}

// ---------- boot ----------
// Photos load before the first paint so renders stay synchronous; the app is
// usable either way, so a failed store degrades to text rather than a blank page.
photoLoadAll().then(function () {
  renderAll();
  showView();
});
