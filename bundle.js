const fs=require('fs'),path=require('path'),dir=path.join(__dirname,'leads');
const css=fs.readFileSync(path.join(dir,'tracker.css'),'utf8');
const dataPerth=fs.readFileSync(path.join(dir,'data.js'),'utf8');
const dataAu1=fs.readFileSync(path.join(dir,'data-au.js'),'utf8');
const dataAu2=fs.readFileSync(path.join(dir,'data-au-2.js'),'utf8');
const dataAu3=fs.readFileSync(path.join(dir,'data-au-3.js'),'utf8');
const dataAu4=fs.readFileSync(path.join(dir,'data-au-4.js'),'utf8');
const dataAu5=fs.readFileSync(path.join(dir,'data-au-5.js'),'utf8');
const js=fs.readFileSync(path.join(dir,'tracker.js'),'utf8');

const extraCSS = `
.tab-bar{display:flex;gap:0;margin:0}
.tab-btn{padding:10px 24px;border:none;background:transparent;color:var(--muted);font-family:var(--font);font-size:0.95rem;font-weight:600;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.2s}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--cyan);border-bottom-color:var(--cyan)}
.tab-count{font-size:0.75rem;padding:2px 6px;border-radius:999px;background:rgba(57,208,216,0.15);color:var(--cyan);margin-left:6px}
.help-btn{padding:8px 16px;border-radius:8px;border:1px solid var(--yellow);background:rgba(210,153,34,0.1);color:var(--yellow);font-family:var(--font);font-size:0.85rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all 0.2s;white-space:nowrap}
.help-btn:hover{background:var(--yellow);color:#000}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Lead Tracker">
<title>Perth Tech Value — Lead Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${css}
${extraCSS}
</style>
</head>
<body>
<nav style="background:#161b22;padding:12px;display:flex;justify-content:center;gap:16px;border-bottom:1px solid #30363d;font-family:'Outfit',sans-serif;">
  <a href="../leads/lead-tracker-portable.html" style="color:#3fb950;text-decoration:none;font-weight:600;padding:4px 8px;border-radius:4px;background:rgba(63,185,80,0.1);">🌐 Web Leads</a>
  <a href="../charity/charity-tracker-portable.html" style="color:#c9d1d9;text-decoration:none;font-weight:600;padding:4px 8px;border-radius:4px;">🏠 Charity Leads</a>
  <a href="../security/security-tracker-portable.html" style="color:#c9d1d9;text-decoration:none;font-weight:600;padding:4px 8px;border-radius:4px;">👁️ Security Leads</a>
</nav>
<header class="topbar">
  <div class="topbar-inner">
    <h1 class="app-title">} Perth Tech Value <span>Lead Tracker</span></h1>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="perth">📍 Perth Local <span class="tab-count">100</span></button>
        <button class="tab-btn" data-tab="australia">🇦🇺 Australia Wide <span class="tab-count">250</span></button>
      </div>
      <a class="help-btn" href="mailto:psy@xfer.au?subject=Lead%20Tracker%20Help&body=Hi%2C%20I%20need%20help%20with%20the%20lead%20tracker...">❓ Confused about anything?</a>
    </div>
  </div>
</header>
<div class="toolbar">
  <div class="toolbar-inner">
    <div class="search-box"><input type="text" id="search" placeholder="Search businesses..." autocomplete="off"></div>
    <div class="filter-group">
      <select id="filter-status"><option value="all">All Statuses</option><option value="new">🔵 New</option><option value="contacted">🟡 Contacted</option><option value="interested">🟢 Interested</option><option value="not-interested">🔴 Not Interested</option><option value="no-answer">⚪ No Answer</option><option value="done">✅ Done</option></select>
      <select id="filter-category"><option value="all">All Categories</option></select>
      <select id="filter-contact"><option value="all">All Contact Types</option><option value="direct">Has Email/Phone</option><option value="form-only">Contact Form Only</option><option value="none">No Website</option></select>
    </div>
  </div>
</div>
<div class="stats-bar" id="stats-bar" style="max-width:1440px;margin:0 auto;padding:12px 24px;display:flex;gap:12px;flex-wrap:wrap;font-size:0.8rem"></div>
<main class="main" id="main"><div class="card-grid" id="card-grid"></div></main>
<div class="modal-overlay" id="modal-overlay"><div class="modal" id="modal"><button class="modal-close" id="modal-close">&times;</button><div id="modal-content"></div></div></div>
<script>${dataPerth}</script>
<script>${dataAu1}</script>
<script>${dataAu2}</script>
<script>${dataAu3}</script>
<script>${dataAu4}</script>
<script>${dataAu5}</script>
<script>${js}</script>
</body>
</html>`;

const out=path.join(dir,'lead-tracker-portable.html');
fs.writeFileSync(out,html,'utf8');
console.log('Bundled:',out);
console.log('Size:',(Buffer.byteLength(html)/1024).toFixed(1),'KB');
