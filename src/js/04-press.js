// ---------- the press ----------
// Slot order: 0..3 is the top row left to right, printed upside down; 4..7 is
// the bottom row. The two presets are the two fold handednesses, and they are
// the same two the hand kit in press/ offers. check.sh holds them equal: an
// imposition that disagrees with the kit is a stack of misfolded paper.
var PRESET_A = [5, 4, 3, 2, 6, 7, 8, 1];
var PRESET_B = [2, 3, 4, 5, 1, 8, 7, 6];
var PANEL_SEED = [
  { h: 'STOOP ZINE', body: 'Our dispatch.\nLife, projects & notes.' },
  { h: 'THE WEEK', body: 'Moments, highlights and quotes from the daily log.' },
  { h: 'PROJECTS', body: 'Active builds, shop progress, and creative work.' },
  { h: 'REFLECTIONS', body: 'Thoughts, milestones, and what we learned.' },
  { h: 'TODO & RUNS', body: 'Shared tasks checked off and what is on deck.' },
  { h: 'SCRATCHPAD', body: 'Ideas, sketches, recipes, and recommendations.' },
  { h: 'LOOKING AHEAD', body: 'Next week: plans, goals, upcoming experiments.' },
  { h: 'BACK COVER', body: 'Printed on a single sheet of paper.' }
];
var armedPhoto = null;

function pressState() {
  if (!state.press) {
    state.press = {
      layout: 'A',
      issue: '01',
      panels: PANEL_SEED.map(function (p) { return { h: p.h, body: p.body, photo: null }; })
    };
  }
  if (!Array.isArray(state.press.panels) || state.press.panels.length !== 8) {
    state.press.panels = PANEL_SEED.map(function (p) { return { h: p.h, body: p.body, photo: null }; });
  }
  return state.press;
}

// Assign each page to its slot. Nothing about the sheet's DOM order changes;
// only CSS order and the 180-degree flip on the top row.
function savePress() {
  pressState().ts = Date.now();
  saveState();
}

function layoutSheet() {
  var ps = pressState();
  var map = ps.layout === 'B' ? PRESET_B : PRESET_A;
  var sheet = document.getElementById('zinesheet');
  if (!sheet) return;
  map.forEach(function (page, slot) {
    var el = sheet.querySelector('[data-page="' + page + '"]');
    if (!el) return;
    el.style.order = slot;
    el.classList.toggle('flip', slot < 4);
  });
  var btn = document.getElementById('swaplayoutbtn');
  if (btn) btn.textContent = 'SWAP FOLD (' + ps.layout + ')';
}

function renderPress() {
  var ps = pressState();
  var sheet = document.getElementById('zinesheet');
  if (!sheet) return;

  ps.panels.forEach(function (panel, i) {
    var el = sheet.querySelector('[data-page="' + (i + 1) + '"]');
    if (!el) return;
    var head = el.querySelector('h3');
    var body = el.querySelector('.body');
    if (head && head.innerText !== panel.h) head.innerText = panel.h;
    if (body && body.innerText !== panel.body) body.innerText = panel.body;

    var img = el.querySelector('.panel-photo');
    var drop = el.querySelector('.panel-unpic');
    if (panel.photo && photoCache[panel.photo]) {
      if (!img) {
        img = document.createElement('img');
        img.className = 'panel-photo';
        el.insertBefore(img, body);
      }
      img.src = photoCache[panel.photo];
      if (!drop) {
        drop = document.createElement('button');
        drop.className = 'panel-unpic';
        drop.textContent = '✕';
        drop.title = 'Remove this photo';
        drop.setAttribute('data-delpanelpic', String(i + 1));
        el.appendChild(drop);
      }
    } else {
      if (img) img.remove();
      if (drop) drop.remove();
    }
  });

  var num = document.getElementById('issueno');
  if (num && num.innerText !== ps.issue) num.innerText = ps.issue;

  layoutSheet();
  renderTray();
}

// Every photo in the store, newest first, as a strip you arm and drop.
function renderTray() {
  var tray = document.getElementById('phototray');
  if (!tray) return;
  var ids = state.logs.slice().sort(function (x, y) { return y.ts - x.ts; })
    .filter(function (l) { return l.photo && photoCache[l.photo]; })
    .map(function (l) { return l.photo; });

  if (!ids.length) {
    tray.innerHTML = '<span class="sub">No photos yet. Add some from the log, then drop them into panels here.</span>';
    return;
  }
  tray.innerHTML = ids.map(function (id) {
    return '<img class="tray-photo' + (armedPhoto === id ? ' armed' : '') +
      '" data-traypic="' + esc(id) + '" src="' + esc(photoCache[id]) + '" alt="">';
  }).join('');
}

function armPhoto(id) {
  armedPhoto = armedPhoto === id ? null : id;
  renderTray();
  var hint = document.getElementById('trayhint');
  if (hint) {
    hint.textContent = armedPhoto
      ? 'Photo armed — now click the panel you want it on.'
      : 'Click a photo to arm it, then click a panel to place it.';
    hint.classList.toggle('on', !!armedPhoto);
  }
}

function placePhoto(page) {
  if (!armedPhoto) return false;
  pressState().panels[page - 1].photo = armedPhoto;
  armPhoto(null);
  savePress();
  renderPress();
  toast('Placed photo on p.' + page);
  return true;
}

// Panels are contenteditable; capture what was typed rather than re-rendering
// under the caret, which would fight the cursor on every keystroke.
function capturePanels() {
  var ps = pressState();
  var sheet = document.getElementById('zinesheet');
  if (!sheet) return;
  ps.panels.forEach(function (panel, i) {
    var el = sheet.querySelector('[data-page="' + (i + 1) + '"]');
    if (!el) return;
    var head = el.querySelector('h3');
    var body = el.querySelector('.body');
    if (head) panel.h = head.innerText.trim();
    if (body) panel.body = body.innerText.replace(/\n{3,}/g, '\n\n').trimEnd();
  });
  var num = document.getElementById('issueno');
  if (num) ps.issue = num.innerText.trim().replace(/^№/, '');
  savePress();
}

function setPanel(page, body) {
  pressState().panels[page - 1].body = body;
}

// Pull the issue out of what has actually been written since the last one.
function compileZine() {
  var ps = pressState();
  var byNew = function (x, y) { return y.ts - x.ts; };
  var logs = state.logs.slice().sort(byNew);

  var moments = logs.filter(function (l) { return l.text; }).slice(0, 5)
    .map(function (l) { return '• [' + nameOf(l.author) + '] ' + l.text; }).join('\n\n');
  var open = state.todos.filter(function (t) { return !t.done; }).slice(0, 6)
    .map(function (t) { return '[ ] ' + t.text; }).join('\n');
  var done = state.todos.filter(function (t) { return t.done; }).slice(0, 3)
    .map(function (t) { return '[x] ' + t.text; }).join('\n');
  var projects = state.projects.slice(0, 3)
    .map(function (p) { return '★ ' + p.title + '\n' + p.desc; }).join('\n\n');
  var entry = state.journal.slice().sort(byNew)[0];

  setPanel(2, moments || 'A quiet week.');
  setPanel(3, projects || 'Between projects.');
  setPanel(4, entry ? entry.title.toUpperCase() + '\n\n' + entry.body : 'Keep writing.');
  setPanel(5, [open, done].filter(Boolean).join('\n\n') || 'All errands checked off.');
  ps.panels[7].body = 'Issue №' + ps.issue + '\nBy ' + names.a + ' & ' + names.b + '.\n\n' +
    'Made on a stoop. Take one, leave one.';

  // The cover earns the newest photo unless something is already placed there.
  var newest = logs.filter(function (l) { return l.photo && photoCache[l.photo]; })[0];
  if (newest && !ps.panels[0].photo) ps.panels[0].photo = newest.photo;

  savePress();
  renderPress();
  toast('Compiled the issue from your log, journal, and lists');
}

function clearSheet() {
  var ps = pressState();
  ps.panels.forEach(function (p) { p.body = ''; p.photo = null; });
  savePress();
  renderPress();
  toast('Cleared the sheet');
}

function swapLayout() {
  var ps = pressState();
  ps.layout = ps.layout === 'A' ? 'B' : 'A';
  savePress();
  layoutSheet();
  toast('Fold layout ' + ps.layout + ' — print a test sheet before committing');
}

function toggleTestSheet() {
  var sheet = document.getElementById('zinesheet');
  var btn = document.getElementById('testsheetbtn');
  if (!sheet) return;
  var on = sheet.classList.toggle('testing');
  if (btn) {
    btn.textContent = 'TEST SHEET: ' + (on ? 'ON' : 'OFF');
    btn.classList.toggle('on', on);
  }
}
