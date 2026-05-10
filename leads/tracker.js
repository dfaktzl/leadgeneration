const SUPABASE_URL = 'https://jsoazogqoowxxafbviel.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Fz4MKqPm4VASpoQe-EDaVg_ii6hAYhs'; 

document.addEventListener('DOMContentLoaded', async () => {
  const STORAGE_KEY = 'ptv_lead_tracker';
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

  // Tab support: use globals if available, else fall back to LEADS only
  let currentTab = 'perth';
  function getActiveLeads() {
    if (currentTab === 'australia' && typeof LEADS_AU !== 'undefined') {
      return [].concat(
        typeof LEADS_AU !== 'undefined' ? LEADS_AU : [],
        typeof LEADS_AU_2 !== 'undefined' ? LEADS_AU_2 : [],
        typeof LEADS_AU_3 !== 'undefined' ? LEADS_AU_3 : [],
        typeof LEADS_AU_4 !== 'undefined' ? LEADS_AU_4 : [],
        typeof LEADS_AU_5 !== 'undefined' ? LEADS_AU_5 : []
      );
    }
    return LEADS;
  }

  const catSelect = document.getElementById('filter-category');
  function rebuildCategories() {
    catSelect.innerHTML = '<option value="all">All Categories</option>';
    const cats = [...new Set(getActiveLeads().map(l => l.category))].sort();
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
    if (l.contactForm) return 'form-only';
    if (!l.website) return 'none';
    return 'form-only';
  }

  function catClass(cat) {
    const c = cat.toLowerCase();
    if (['cafe','cafe/bakery','bakery','restaurant','restaurant/bakery','takeaway','butcher'].some(x => c.includes(x))) return 'cat-cafe';
    if (['mechanic','mobile mechanic','plumber','auto electrician','auto glass','auto parts','auto detailing','fencing','electrician','panel beater','tyres','glazier','pool maintenance','upholstery'].some(x => c.includes(x))) return 'cat-mechanic';
    if (['accounting','bookkeeping','tax'].some(x => c.includes(x))) return 'cat-accounting';
    if (['photography','video','real estate media'].some(x => c.includes(x))) return 'cat-photography';
    if (['health','dentist','vet','pharmacy'].some(x => c.includes(x))) return 'cat-health';
    if (['retail','beauty','fitness','martial arts','dance','recreation','sports club','education','music education','childcare'].some(x => c.includes(x))) return 'cat-retail';
    return 'cat-other';
  }

  function geminiUrl(l) {
    const prompt = encodeURIComponent(
      `I'm a web design freelancer in Perth, WA calling "${l.name}" (${l.category}, ${l.suburb}). ` +
      `Business info: ${l.desc} ` +
      `Their web issues: ${l.issues.join('; ')}. ` +
      `${l.website ? 'Their website is ' + l.website : 'They have NO website at all.'}` +
      ` Write me a natural, friendly phone script (30 seconds max) introducing myself and pitching how I can help them. Include a specific talking point about their biggest issue. Keep it conversational, not salesy.`
    );
    return `https://gemini.google.com/app?q=${prompt}`;
  }

  function statusEmoji(s) { return {new:'🔵',contacted:'🟡',interested:'🟢','not-interested':'🔴','no-answer':'⚪',done:'✅'}[s]||'🔵'; }

  function updateStats() {
    const leads = getActiveLeads();
    const c = {new:0,contacted:0,interested:0,'not-interested':0,'no-answer':0,done:0};
    leads.forEach(l => { if(isDone(l.id)) c.done++; else c[getS(l.id)]++; });
    const noWeb = leads.filter(l => !l.website).length;
    statsBar.innerHTML = `
      <span class="stat"><span class="stat-dot" style="background:#39d0d8"></span>New: ${c.new}</span>
      <span class="stat"><span class="stat-dot" style="background:#d29922"></span>Contacted: ${c.contacted}</span>
      <span class="stat"><span class="stat-dot" style="background:#3fb950"></span>Interested: ${c.interested}</span>
      <span class="stat"><span class="stat-dot" style="background:#f85149"></span>Not Int: ${c['not-interested']}</span>
      <span class="stat"><span class="stat-dot" style="background:#8b949e"></span>No Ans: ${c['no-answer']}</span>
      <span class="stat"><span class="stat-dot" style="background:#a371f7"></span>Done: ${c.done}</span>
      <span class="stat" style="color:#f85149">🚫 No Website: ${noWeb}</span>
      <span class="stat" style="font-weight:700">Total: ${leads.length}</span>`;
  }

  function render() {
    const search = searchInput.value.toLowerCase();
    const sF = statusFilter.value;
    const cF = categoryFilter.value;
    const ctF = contactFilter.value;
    const filtered = getActiveLeads().filter(l => {
      if (search && !`${l.name} ${l.category} ${l.suburb} ${l.desc}`.toLowerCase().includes(search)) return false;
      const s = isDone(l.id) ? 'done' : getS(l.id);
      if (sF !== 'all' && s !== sF) return false;
      if (cF !== 'all' && l.category !== cF) return false;
      if (ctF !== 'all' && contactType(l) !== ctF) return false;
      return true;
    });
    if (!filtered.length) { grid.innerHTML = '<div class="empty-state">No leads match your filters.</div>'; updateStats(); return; }

    grid.innerHTML = filtered.map(l => {
      const s = isDone(l.id) ? 'done' : getS(l.id);
      const n = getN(l.id);
      const done = isDone(l.id);
      const cb = isCallback(l.id);
      const noWeb = !l.website;
      const contacts = [];
      if (l.phone) contacts.push(`<span class="contact-chip">📞 <a href="tel:${l.phone}">${l.phone}</a></span>`);
      if (l.email) contacts.push(`<span class="contact-chip">✉️ <a href="mailto:${l.email}">${l.email}</a></span>`);
      if (l.website) contacts.push(`<span class="contact-chip">🌐 <a href="https://${l.website}" target="_blank" rel="noopener">${l.website}</a></span>`);

      let cClass = `lead-card status-${s}`;
      if (noWeb) cClass += ' no-website';
      if (cb) cClass += ' is-callback';

      return `<div class="${cClass}" data-id="${l.id}">
        <div class="card-top">
          <div><div class="card-name">${l.name}</div><div class="card-meta">📍 ${l.suburb}</div></div>
          <div class="card-badges">
            <span class="badge-cat ${catClass(l.category)}">${l.category}</span>
            ${noWeb ? '<span class="badge-cat badge-noweb">🚫 No Website</span>' : '<span class="badge-cat badge-hasweb">🌐 Has Site</span>'}
          </div>
        </div>
        <div class="card-desc">${l.desc}</div>
        <div class="card-issues">${l.issues.slice(0,2).map(i=>`<div class="card-issue">${i}</div>`).join('')}</div>
        <div class="card-contacts">${contacts.join('')}</div>
        <div class="card-actions">
          <select class="card-sel" data-id="${l.id}">
            <option value="new" ${s==='new'?'selected':''}>🔵 New</option>
            <option value="contacted" ${s==='contacted'?'selected':''}>🟡 Contacted</option>
            <option value="interested" ${s==='interested'?'selected':''}>🟢 Interested</option>
            <option value="not-interested" ${s==='not-interested'?'selected':''}>🔴 Not Interested</option>
            <option value="no-answer" ${s==='no-answer'?'selected':''}>⚪ No Answer</option>
          </select>
          <button class="btn-done${done?' is-done':''}" data-id="${l.id}">${done?'✅ Done':'☐ Done'}</button>
          <button class="btn-callback${cb?' active':''}" data-id="${l.id}">${cb?'📞 Call Back Needed':'📞 Call Back'}</button>
          <a class="btn-gemini" href="${geminiUrl(l)}" target="_blank" rel="noopener" title="Get AI call script">✨ Gemini</a>
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
    const l = getActiveLeads().find(x=>x.id===id); if(!l)return;
    const s=isDone(l.id)?'done':getS(l.id), n=getN(l.id);
    let ch='';
    if(l.phone)ch+=`<div>📞 <a href="tel:${l.phone}">${l.phone}</a></div>`;
    if(l.email)ch+=`<div>✉️ <a href="mailto:${l.email}">${l.email}</a></div>`;
    if(l.contactForm)ch+=`<div>📝 Has contact form on website</div>`;
    if(!l.phone&&!l.email&&!l.contactForm)ch+=`<div>❌ No direct contact — visit in person</div>`;
    modalContent.innerHTML = `
      <h2>${l.name}</h2>
      <div class="m-meta">${l.category} · 📍 ${l.suburb} · ${statusEmoji(s)} ${s.replace('-',' ')}</div>
      ${l.website?`<div class="m-website m-section">🌐 <a href="https://${l.website}" target="_blank">${l.website}</a></div>`:'<div class="m-section" style="color:var(--red)">🚫 No website — HUGE opportunity!</div>'}
      <div class="m-desc">${l.desc}</div>
      <div class="m-section"><div class="m-label">Talking Points / Issues</div>${l.issues.map(i=>`<div class="m-issue">${i}</div>`).join('')}</div>
      <div class="m-section m-contacts"><div class="m-label">Contact Details</div>${ch}</div>
      <div class="m-section"><div class="m-label">Status</div>
        <select id="modal-status" style="width:100%;padding:10px;font-size:1rem;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:var(--font)">
          <option value="new" ${s==='new'?'selected':''}>🔵 New</option><option value="contacted" ${s==='contacted'?'selected':''}>🟡 Contacted</option>
          <option value="interested" ${s==='interested'?'selected':''}>🟢 Interested</option><option value="not-interested" ${s==='not-interested'?'selected':''}>🔴 Not Interested</option>
          <option value="no-answer" ${s==='no-answer'?'selected':''}>⚪ No Answer</option></select></div>
      <div class="m-section"><div class="m-label">Notes</div><textarea id="modal-notes" style="width:100%;min-height:80px;padding:10px;font-size:0.95rem;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:var(--font)">${n}</textarea></div>
      <div class="m-section" style="text-align:center"><a class="btn-gemini" href="${geminiUrl(l)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 24px;font-size:1rem">✨ Get AI Call Script with Gemini</a></div>`;
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

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      rebuildCategories();
      render();
    });
  });

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
