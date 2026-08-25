(function(){
  const STORAGE_KEY = 'stoop_data_v2';
  const AUTHORS = ['Suds', 'Partner', 'Together'];
  let currentAuthor = localStorage.getItem('stoop_active_author') || 'Suds';
  let activeLogFilter = 'all', activeTodoFilter = 'all';

  const defaultData = {
    logs: [
      { id: 'l1', author: 'Suds', tag: 'moment', text: 'First clean run of the shop workbench setup. Smooth edges on the steel cut.', time: 'Aug 24 · 4:30 PM' },
      { id: 'l2', author: 'Partner', tag: 'quote', text: '"The only way out is through, and the best way through is together."', time: 'Aug 24 · 7:15 PM' },
      { id: 'l3', author: 'Together', tag: 'idea', text: 'Weekend road trip sketch: farm stand cider, thrift store run, back before sunset.', time: 'Aug 25 · 9:00 AM' }
    ],
    todos: [
      { id: 't1', cat: 'groceries', text: 'Coffee beans (dark roast)', done: false },
      { id: 't2', cat: 'house', text: 'Hang kitchen spice shelf', done: false },
      { id: 't3', cat: 'shared', text: 'Plan Friday dinner & movie', done: false },
      { id: 't4', cat: 'Suds', text: 'Oil shop drill press & clamps', done: true },
      { id: 't5', cat: 'Partner', text: 'Pick up sketchbook paper', done: false }
    ],
    projects: [
      { id: 'p1', title: 'Pocket Synth (Noodles)', desc: 'Web Audio polyphonic sketchpad. Dialing in chord voicings and tactile groove controls.', updated: 'Aug 25' },
      { id: 'p2', title: 'Backyard Herb Garden', desc: 'Raised cedar bed: basil, rosemary, thyme, cherry tomatoes. Drip irrigation line.', updated: 'Aug 23' },
      { id: 'p3', title: 'Zine Issue #01', desc: 'First monthly digest of thoughts, photos, and project notes. 8-page 1-sheet fold.', updated: 'Aug 25' }
    ],
    journal: [
      { id: 'j1', author: 'Together', title: 'Sunday Morning Coffee & Quiet', body: 'Made pour-overs, sat on the porch while the sun came up over the street. Talked about where we want our time to go this autumn. Fewer distractions, more physical making.', time: 'Aug 24' }
    ]
  };

  let state = (() => {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
    return JSON.parse(JSON.stringify(defaultData));
  })();

  const saveState = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };
  const toast = (msg) => {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block'; clearTimeout(t._h);
    t._h = setTimeout(() => { t.style.display = 'none'; }, 2400);
  };
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function renderAuthor() {
    const el = document.getElementById('authorname'); if (el) el.textContent = currentAuthor;
    const jAuth = document.getElementById('journalauthor'); if (jAuth) jAuth.value = currentAuthor;
  }
  function toggleAuthor() {
    currentAuthor = AUTHORS[(AUTHORS.indexOf(currentAuthor) + 1) % AUTHORS.length];
    localStorage.setItem('stoop_active_author', currentAuthor);
    renderAuthor(); toast(`Active author: ${currentAuthor}`);
  }

  // --- LOGS ---
  function renderLogs() {
    const list = document.getElementById('loglist'); if (!list) return;
    const filtered = state.logs.filter(l => activeLogFilter === 'all' || l.author === activeLogFilter);
    if (!filtered.length) { list.innerHTML = '<div class="paper sub" style="text-align:center;">No logs matching filter.</div>'; return; }
    list.innerHTML = filtered.map(l => `
      <div class="log-card author-${esc(l.author)}">
        <div class="log-meta">
          <span><span class="log-author">${esc(l.author)}</span> · <span class="tag cold" style="margin:0;">${esc(l.tag)}</span> · ${esc(l.time)}</span>
          <button class="log-del" data-dellog="${esc(l.id)}" title="Delete">✕</button>
        </div>
        <div class="log-body">${esc(l.text)}</div>
      </div>
    `).join('');
  }
  function addLog() {
    const inp = document.getElementById('loginput'), tag = document.getElementById('logtag');
    if (!inp || !inp.value.trim()) return;
    const d = new Date();
    state.logs.unshift({
      id: 'l_' + Date.now(), author: currentAuthor, tag: tag?.value || 'moment',
      text: inp.value.trim(),
      time: `${d.toLocaleString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    });
    inp.value = ''; saveState(); renderLogs(); toast('Posted to log');
  }

  // --- TODOS ---
  function renderTodos() {
    const list = document.getElementById('todolist'); if (!list) return;
    const filtered = state.todos.filter(t => activeTodoFilter === 'all' || t.cat === activeTodoFilter);
    if (!filtered.length) { list.innerHTML = '<div class="sub" style="padding:1rem;text-align:center;">All caught up! No items here.</div>'; return; }
    list.innerHTML = filtered.map(t => `
      <div class="todo-item ${t.done ? 'done' : ''}">
        <input type="checkbox" class="todo-check" data-toggletodo="${esc(t.id)}" ${t.done ? 'checked' : ''}>
        <span class="todo-text">${esc(t.text)}</span>
        <span class="todo-tag">${esc(t.cat)}</span>
        <button class="log-del" data-deltodo="${esc(t.id)}">✕</button>
      </div>
    `).join('');
  }
  function addTodo() {
    const inp = document.getElementById('todoinput'), cat = document.getElementById('todocat');
    if (!inp || !inp.value.trim()) return;
    state.todos.unshift({ id: 't_' + Date.now(), cat: cat?.value || 'shared', text: inp.value.trim(), done: false });
    inp.value = ''; saveState(); renderTodos(); toast('Added todo');
  }
  function clearCompletedTodos() {
    state.todos = state.todos.filter(t => !t.done);
    saveState(); renderTodos(); toast('Cleared completed items');
  }

  // --- PROJECTS ---
  function renderProjects() {
    const list = document.getElementById('projectlist'); if (!list) return;
    if (!state.projects.length) { list.innerHTML = '<div class="sub" style="padding:1rem;">No active projects. Start one above!</div>'; return; }
    list.innerHTML = state.projects.map(p => `
      <div class="project-card">
        <h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>
        <div class="project-card-foot">
          <span>Updated ${esc(p.updated)}</span>
          <button class="log-del" data-delproject="${esc(p.id)}">DELETE</button>
        </div>
      </div>
    `).join('');
  }
  function addProject() {
    const titleInp = document.getElementById('projecttitle'), descInp = document.getElementById('projectdesc');
    if (!titleInp || !titleInp.value.trim()) return;
    state.projects.unshift({
      id: 'p_' + Date.now(), title: titleInp.value.trim(), desc: descInp?.value.trim() || '',
      updated: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric' })
    });
    titleInp.value = ''; if (descInp) descInp.value = '';
    saveState(); renderProjects(); toast('Created project');
  }

  // --- JOURNAL ---
  function renderJournal() {
    const list = document.getElementById('journallist'); if (!list) return;
    if (!state.journal.length) { list.innerHTML = '<div class="paper sub" style="text-align:center;">No journal entries yet.</div>'; return; }
    list.innerHTML = state.journal.map(j => `
      <div class="journal-card">
        <div class="journal-card-head">
          <h2>${esc(j.title)}</h2>
          <span class="sub">${esc(j.author)} · ${esc(j.time)} <button class="log-del" data-deljournal="${esc(j.id)}" style="margin-left:.6rem;">✕</button></span>
        </div>
        <div class="journal-card-body">${esc(j.body)}</div>
      </div>
    `).join('');
  }
  function addJournal() {
    const titleInp = document.getElementById('journaltitle'), authorInp = document.getElementById('journalauthor'), bodyInp = document.getElementById('journalbody');
    if (!titleInp || !titleInp.value.trim() || !bodyInp || !bodyInp.value.trim()) { toast('Please enter title and content'); return; }
    state.journal.unshift({
      id: 'j_' + Date.now(), author: authorInp?.value || currentAuthor,
      title: titleInp.value.trim(), body: bodyInp.value.trim(),
      time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    titleInp.value = ''; bodyInp.value = '';
    saveState(); renderJournal(); toast('Saved journal entry');
  }

  // --- ZINE COMPILER ---
  function compileZine() {
    const recentLogs = state.logs.slice(0, 3).map(l => `• [${l.author}] ${l.text}`).join('\n');
    const activeTodos = state.todos.filter(t => !t.done).slice(0, 4).map(t => `[ ] ${t.text}`).join('\n');
    const topProjects = state.projects.slice(0, 2).map(p => `★ ${p.title}: ${p.desc.slice(0, 60)}...`).join('\n\n');
    const topJournal = state.journal[0] ? `${state.journal[0].title}\n\n${state.journal[0].body.slice(0, 180)}...` : 'Keep writing together.';
    const setBody = (id, text) => { const p = document.getElementById(id); if (p) { const b = p.querySelector('.body'); if (b) b.innerText = text; } };

    setBody('p_2', recentLogs || 'No log entries this week.');
    setBody('p_3', topProjects || 'Working on new ideas.');
    setBody('p_4', topJournal);
    setBody('p_5', activeTodos || 'All errands checked off!');
    setBody('p_6', 'Recommendations, recipes, and notes to remember.');
    setBody('p_7', 'Goals & plans for the upcoming week.');
    toast('Compiled latest logs & journal into zine sheet!');
  }

  // --- BACKUP & SYNC ---
  function exportBackup() {
    const a = document.createElement('a');
    a.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2)));
    a.setAttribute('download', `stoop-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(a); a.click(); a.remove(); toast('Backup downloaded');
  }
  function handleImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.logs && parsed.todos) { state = parsed; saveState(); renderAll(); toast('Restored backup!'); }
        else toast('Invalid backup format');
      } catch { toast('Failed to read JSON'); }
    };
    reader.readAsText(file);
  }
  function resetData() {
    if (confirm('Reset to sample data? Current local data will be replaced.')) {
      state = JSON.parse(JSON.stringify(defaultData)); saveState(); renderAll(); toast('Reset to defaults');
    }
  }

  function renderAll() {
    renderAuthor(); renderLogs(); renderTodos(); renderProjects(); renderJournal();
  }

  // --- NAVIGATION ---
  const views = document.querySelectorAll('section[data-view]'), navs = document.querySelectorAll('[data-nav]');
  function showView() {
    let h = (location.hash || '#log').slice(1).split('/')[0], hit = false;
    views.forEach(v => { const on = v.getAttribute('data-view') === h; v.classList.toggle('on', on); if (on) hit = true; });
    if (!hit) { views.forEach(v => { v.classList.toggle('on', v.getAttribute('data-view') === 'log'); }); h = 'log'; }
    navs.forEach(a => { a.classList.toggle('here', a.getAttribute('data-nav') === h); });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', showView);

  // --- EVENT DELEGATION ---
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.id === 'authortoggle' || t.closest('#authortoggle')) toggleAuthor();
    else if (t.id === 'logaddbtn') addLog();
    else if (t.dataset.dellog) { state.logs = state.logs.filter(l => l.id !== t.dataset.dellog); saveState(); renderLogs(); }
    else if (t.dataset.logfilter) {
      activeLogFilter = t.dataset.logfilter;
      document.querySelectorAll('[data-logfilter]').forEach(b => b.classList.toggle('on', b.dataset.logfilter === activeLogFilter));
      renderLogs();
    }
    else if (t.id === 'todoaddbtn') addTodo();
    else if (t.dataset.toggletodo) {
      const item = state.todos.find(i => i.id === t.dataset.toggletodo);
      if (item) { item.done = t.checked; saveState(); renderTodos(); }
    }
    else if (t.dataset.deltodo) { state.todos = state.todos.filter(i => i.id !== t.dataset.deltodo); saveState(); renderTodos(); }
    else if (t.dataset.todofilter) {
      activeTodoFilter = t.dataset.todofilter;
      document.querySelectorAll('[data-todofilter]').forEach(b => b.classList.toggle('on', b.dataset.todofilter === activeTodoFilter));
      renderTodos();
    }
    else if (t.id === 'clearcompletedbtn') clearCompletedTodos();
    else if (t.id === 'projectaddbtn') addProject();
    else if (t.dataset.delproject) { state.projects = state.projects.filter(p => p.id !== t.dataset.delproject); saveState(); renderProjects(); }
    else if (t.id === 'journaladdbtn') addJournal();
    else if (t.dataset.deljournal) { state.journal = state.journal.filter(j => j.id !== t.dataset.deljournal); saveState(); renderJournal(); }
    else if (t.id === 'compilezinebtn') compileZine();
    else if (t.id === 'printzinebtn') window.print();
    else if (t.id === 'clearzinebtn') { document.querySelectorAll('.panel .body').forEach(b => b.innerText = ''); toast('Cleared zine panels'); }
    else if (t.id === 'exportbtn') exportBackup();
    else if (t.id === 'importbtn') document.getElementById('importfile')?.click();
    else if (t.id === 'resetbtn') resetData();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'loginput') addLog();
    else if (e.key === 'Enter' && e.target.id === 'todoinput') addTodo();
  });

  const importInp = document.getElementById('importfile');
  if (importInp) importInp.addEventListener('change', (e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); });

  renderAll();
  showView();
})();
