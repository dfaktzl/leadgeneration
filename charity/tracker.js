// --- CLOUD SYNC CONFIGURATION ---
// To enable real-time cloud sync, create two tables in Supabase:
// 1. 'tracker_state' (columns: project_name (text, primary key), state_json (jsonb))
// 2. 'shared_notepad' (columns: project_name (text, primary key), note_text (text))
// Enable Realtime for BOTH tables. Paste your URL and Anon Key below.
const SUPABASE_URL = ''; 
const SUPABASE_KEY = ''; 

document.addEventListener('DOMContentLoaded', async () => {
  const STORAGE_KEY = 'phb_partner_tracker';
  const NOTEPAD_KEY = STORAGE_KEY + '_notepad';
  
  let state = {};
  let supabase = null;

  if (SUPABASE_URL && SUPABASE_KEY && typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  function mergeState(newState) {
    state = { ...state, ...newState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof render === 'function') render();
  }

  async function loadState() {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (supabase) {
      try {
        const { data } = await supabase.from('tracker_state').select('state_json').eq('project_name', STORAGE_KEY).single();
        if (data && data.state_json) {
          state = { ...state, ...data.state_json };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      } catch(e) { console.error('Cloud load error:', e); }
    }
  }

  async function saveState(s) {
    state = { ...state, ...s };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (supabase) {
      try {
        await supabase.from('tracker_state').upsert({ project_name: STORAGE_KEY, state_json: state });
      } catch(e) { console.error('Cloud save error:', e); }
    }
  }

  await loadState();

  const ALL_LEADS = [].concat(
    typeof LEADS_CHARITY_1 !== 'undefined' ? LEADS_CHARITY_1 : [],
    typeof LEADS_CHARITY_2 !== 'undefined' ? LEADS_CHARITY_2 : [],
    typeof LEADS_CHARITY_3 !== 'undefined' ? LEADS_CHARITY_3 : []
  );

  const catSelect = document.getElementById('filter-category');
  function rebuildCategories() {
    catSelect.innerHTML = '<option value="all">All Categories</option>';
    const cats = [...new Set(ALL_LEADS.map(l => l.category))].sort();
    cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSelect.appendChild(o); });
  }
  rebuildCategories();

  const grid = document.getElementById('card-grid');
  const searchInput = document.getElementById('search');
  const statusFilter = document.getElementById('filter-status');
  const categoryFilter = document.getElementById('filter-category');
  const contactFilter = document.getElementById('filter-contact');
  const statsBar = document.getElementById('stats-bar');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');

  function getS(id) { return state[id]?.status || 'new'; }
  function getN(id) { return state[id]?.notes || ''; }
  function isDone(id) { return state[id]?.done || false; }
  function isCallback(id) { return state[id]?.callback || false; }

  function contactType(l) {
    if (l.email || l.phone) return 'direct';
    if (l.website) return 'form-only';
    return 'none';
  }

  function catClass(cat) {
    const c = cat.toLowerCase();
    if (c.includes('grant')) return 'cat-accounting'; // Greenish
    if (c.includes('corporate')) return 'cat-cafe'; // Orangey
    if (c.includes('philanthropy')) return 'cat-mechanic'; // Bluish
    if (c.includes('partner')) return 'cat-retail'; // Purple
    if (c.includes('pro-bono')) return 'cat-health'; // Reddish
    return 'cat-other';
  }

  function geminiUrl(l) {
    const prompt = encodeURIComponent(
      `I'm representing Perth Housing Bridge, a homeless charity in WA. We are reaching out to "${l.name}" (${l.category}, ${l.location}). ` +
      `Their organization info: ${l.desc} ` +
      `Our key talking points/issues to bring up with them: ${l.issues.join('; ')}. ` +
      `Write a professional, compelling outreach email/script (short, max 150 words) to start a conversation with them about potential collaboration, funding, or support. Be warm and partnership-focused.`
    );
    return `https://gemini.google.com/app?q=${prompt}`;
  }

  function statusEmoji(s) { return {new:'🔵',contacted:'🟡',interested:'🟢','not-interested':'🔴','no-answer':'⚪',done:'✅'}[s]||'🔵'; }

  function updateStats() {
    const leads = ALL_LEADS;
    const c = {new:0,contacted:0,interested:0,'not-interested':0,'no-answer':0,done:0};
    leads.forEach(l => { if(isDone(l.id)) c.done++; else c[getS(l.id)]++; });
    statsBar.innerHTML = `
      <span class="stat"><span class="stat-dot" style="background:#39d0d8"></span>New: ${c.new}</span>
      <span class="stat"><span class="stat-dot" style="background:#d29922"></span>Contacted: ${c.contacted}</span>
      <span class="stat"><span class="stat-dot" style="background:#3fb950"></span>In Progress: ${c.interested}</span>
      <span class="stat"><span class="stat-dot" style="background:#f85149"></span>Rejected: ${c['not-interested']}</span>
      <span class="stat"><span class="stat-dot" style="background:#8b949e"></span>No Ans: ${c['no-answer']}</span>
      <span class="stat"><span class="stat-dot" style="background:#a371f7"></span>Secured: ${c.done}</span>
      <span class="stat" style="font-weight:700">Total: ${leads.length}</span>`;
  }

  function render() {
    const search = searchInput.value.toLowerCase();
    const sF = statusFilter.value;
    const cF = categoryFilter.value;
    const ctF = contactFilter.value;
    const filtered = ALL_LEADS.filter(l => {
      if (search && !`${l.name} ${l.category} ${l.location} ${l.desc}`.toLowerCase().includes(search)) return false;
      const s = isDone(l.id) ? 'done' : getS(l.id);
      if (sF !== 'all' && s !== sF) return false;
      if (cF !== 'all' && l.category !== cF) return false;
      if (ctF !== 'all' && contactType(l) !== ctF) return false;
      return true;
    });
    if (!filtered.length) { grid.innerHTML = '<div class="empty-state">No partners match your filters.</div>'; updateStats(); return; }

    grid.innerHTML = filtered.map(l => {
      const s = isDone(l.id) ? 'done' : getS(l.id);
      const n = getN(l.id);
      const done = isDone(l.id);
      const cb = isCallback(l.id);
      const contacts = [];
      if (l.phone) contacts.push(`<span class="contact-chip">📞 <a href="tel:${l.phone}">${l.phone}</a></span>`);
      if (l.email) contacts.push(`<span class="contact-chip">✉️ <a href="mailto:${l.email}">${l.email}</a></span>`);
      if (l.website) contacts.push(`<span class="contact-chip">🌐 <a href="https://${l.website}" target="_blank" rel="noopener">${l.website}</a></span>`);

      return `<div class="lead-card status-${s}${cb?' is-callback':''}" data-id="${l.id}">
        <div class="card-top">
          <div><div class="card-name">${l.name}</div><div class="card-meta">📍 ${l.location}</div></div>
          <div class="card-badges">
            <span class="badge-cat ${catClass(l.category)}">${l.category}</span>
          </div>
        </div>
        <div class="card-desc">${l.desc}</div>
        <div class="card-issues">${l.issues.slice(0,2).map(i=>`<div class="card-issue">${i}</div>`).join('')}</div>
        <div class="card-contacts">${contacts.join('')}</div>
        <div class="card-actions">
          <select class="card-sel" data-id="${l.id}">
            <option value="new" ${s==='new'?'selected':''}>🔵 New</option>
            <option value="contacted" ${s==='contacted'?'selected':''}>🟡 Contacted</option>
            <option value="interested" ${s==='interested'?'selected':''}>🟢 In Progress</option>
            <option value="not-interested" ${s==='not-interested'?'selected':''}>🔴 Rejected</option>
            <option value="no-answer" ${s==='no-answer'?'selected':''}>⚪ No Answer</option>
          </select>
          <button class="btn-done${done?' is-done':''}" data-id="${l.id}">${done?'✅ Secured':'☐ Secured'}</button>
          <button class="btn-callback${cb?' active':''}" data-id="${l.id}">${cb?'📞 Call Back Needed':'📞 Call Back'}</button>
          <a class="btn-gemini" href="${geminiUrl(l)}" target="_blank" rel="noopener" title="Get AI outreach script">✨ Gemini</a>
        </div>
        <textarea class="card-notes" data-id="${l.id}" placeholder="Add notes...">${n}</textarea>
      </div>`;
    }).join('');

    grid.querySelectorAll('.card-sel').forEach(sel => {
      sel.addEventListener('change', e => { e.stopPropagation(); const id=+e.target.dataset.id; if(!state[id])state[id]={}; state[id].status=e.target.value; saveState(state); render(); });
    });
    grid.querySelectorAll('.btn-done').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); const id=+e.target.dataset.id; if(!state[id])state[id]={}; state[id].done=!state[id].done; saveState(state); render(); });
    });
    grid.querySelectorAll('.btn-callback').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); const id=+e.target.dataset.id; if(!state[id])state[id]={}; state[id].callback=!state[id].callback; saveState(state); render(); });
    });
    grid.querySelectorAll('.card-notes').forEach(ta => {
      ta.addEventListener('input', e => { const id=+e.target.dataset.id; if(!state[id])state[id]={}; state[id].notes=e.target.value; saveState(state); });
      ta.addEventListener('click', e => e.stopPropagation());
    });
    grid.querySelectorAll('.lead-card').forEach(card => {
      card.addEventListener('click', e => { if(e.target.closest('select,textarea,a,button')) return; openModal(+card.dataset.id); });
    });
    updateStats();
  }

  function openModal(id) {
    const l = ALL_LEADS.find(x=>x.id===id); if(!l)return;
    const s=isDone(l.id)?'done':getS(l.id), n=getN(l.id);
    let ch='';
    if(l.phone)ch+=`<div>📞 <a href="tel:${l.phone}">${l.phone}</a></div>`;
    if(l.email)ch+=`<div>✉️ <a href="mailto:${l.email}">${l.email}</a></div>`;
    if(!l.phone&&!l.email)ch+=`<div>📝 Contact via website</div>`;
    modalContent.innerHTML = `
      <h2>${l.name}</h2>
      <div class="m-meta">${l.category} · 📍 ${l.location} · ${statusEmoji(s)} ${s.replace('-',' ')}</div>
      ${l.website?`<div class="m-website m-section">🌐 <a href="https://${l.website}" target="_blank">${l.website}</a></div>`:''}
      <div class="m-desc">${l.desc}</div>
      <div class="m-section"><div class="m-label">Action Items / Pitch</div>${l.issues.map(i=>`<div class="m-issue">${i}</div>`).join('')}</div>
      <div class="m-section m-contacts"><div class="m-label">Contact Details</div>${ch}</div>
      <div class="m-section"><div class="m-label">Status</div>
        <select id="modal-status" style="width:100%;padding:10px;font-size:1rem;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:var(--font)">
          <option value="new" ${s==='new'?'selected':''}>🔵 New</option>
          <option value="contacted" ${s==='contacted'?'selected':''}>🟡 Contacted</option>
          <option value="interested" ${s==='interested'?'selected':''}>🟢 In Progress / App Sent</option>
          <option value="not-interested" ${s==='not-interested'?'selected':''}>🔴 Rejected</option>
          <option value="no-answer" ${s==='no-answer'?'selected':''}>⚪ No Answer</option>
        </select>
      </div>
      <div class="m-section"><div class="m-label">Notes</div><textarea id="modal-notes" style="width:100%;min-height:80px;padding:10px;font-size:0.95rem;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:var(--font)">${n}</textarea></div>
      <div class="m-section" style="text-align:center"><a class="btn-gemini" href="${geminiUrl(l)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 24px;font-size:1rem">✨ Draft Outreach with Gemini</a></div>`;
    document.getElementById('modal-status').addEventListener('change',e=>{if(!state[id])state[id]={};state[id].status=e.target.value;saveState(state);render();});
    document.getElementById('modal-notes').addEventListener('input',e=>{if(!state[id])state[id]={};state[id].notes=e.target.value;saveState(state);});
    modalOverlay.classList.add('active');
  }

  modalClose.addEventListener('click',()=>modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click',e=>{if(e.target===modalOverlay)modalOverlay.classList.remove('active');});
  searchInput.addEventListener('input', render);
  statusFilter.addEventListener('change', render);
  categoryFilter.addEventListener('change', render);
  contactFilter.addEventListener('change', render);
  const notepad = document.getElementById('global-notepad');
  if (notepad) {
    notepad.value = localStorage.getItem(NOTEPAD_KEY) || '';
    if (supabase) {
      supabase.from('shared_notepad').select('note_text').eq('project_name', STORAGE_KEY).single().then(({data}) => {
        if (data && data.note_text) {
          notepad.value = data.note_text;
          localStorage.setItem(NOTEPAD_KEY, data.note_text);
        }
      }).catch(e=>console.error('Notepad load error:', e));
    }
    
    let debounceTimer;
    notepad.addEventListener('input', e => {
      const val = e.target.value;
      localStorage.setItem(NOTEPAD_KEY, val);
      if (supabase) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          supabase.from('shared_notepad').upsert({ project_name: STORAGE_KEY, note_text: val }).catch(e=>console.error('Notepad save error:', e));
        }, 500);
      }
    });
  }

  if (supabase) {
    supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracker_state', filter: `project_name=eq.${STORAGE_KEY}` }, payload => {
        if (payload.new && payload.new.state_json) mergeState(payload.new.state_json);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_notepad', filter: `project_name=eq.${STORAGE_KEY}` }, payload => {
        if (notepad && document.activeElement !== notepad && payload.new) {
          notepad.value = payload.new.note_text || '';
          localStorage.setItem(NOTEPAD_KEY, notepad.value);
        }
      })
      .subscribe();
  }

  render();
});
