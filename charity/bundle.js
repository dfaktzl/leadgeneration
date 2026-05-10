const fs=require('fs'),path=require('path'),dir=__dirname;
const css=fs.readFileSync(path.join(dir,'tracker.css'),'utf8');
const data1=fs.readFileSync(path.join(dir,'data-1.js'),'utf8');
const data2=fs.readFileSync(path.join(dir,'data-2.js'),'utf8');
const data3=fs.readFileSync(path.join(dir,'data-3.js'),'utf8');
const js=fs.readFileSync(path.join(dir,'tracker.js'),'utf8');

const extraCSS = `
:root {
  --cyan: #3fb950;
  --yellow: #58a6ff;
  --red: #f85149;
  --bg: #0d1117;
  --panel: #161b22;
  --border: #30363d;
  --text: #c9d1d9;
  --muted: #8b949e;
  --font: 'Outfit', sans-serif;
}
.app-title {
  color: var(--text);
}
.app-title span {
  color: #3fb950;
}
body {
  background: radial-gradient(circle at 50% 0%, #0d2a1b 0%, var(--bg) 50%);
}
.help-btn{padding:8px 16px;border-radius:8px;border:1px solid #3fb950;background:rgba(63,185,80,0.1);color:#3fb950;font-family:var(--font);font-size:0.85rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all 0.2s;white-space:nowrap}
.help-btn:hover{background:#3fb950;color:#000}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Partner Tracker">
<title>Perth Housing Bridge — Partner & Grant Tracker</title>
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
  <a href="../leads/lead-tracker-portable.html" style="color:#c9d1d9;text-decoration:none;font-weight:600;padding:4px 8px;border-radius:4px;">🌐 Web Leads</a>
  <a href="../charity/charity-tracker-portable.html" style="color:#3fb950;text-decoration:none;font-weight:600;padding:4px 8px;border-radius:4px;background:rgba(63,185,80,0.1);">🏠 Charity Leads</a>
  <a href="../security/security-tracker-portable.html" style="color:#c9d1d9;text-decoration:none;font-weight:600;padding:4px 8px;border-radius:4px;">👁️ Security Leads</a>
</nav>
<header class="topbar">
  <div class="topbar-inner">
    <h1 class="app-title">🏠 Perth Housing Bridge <span>Partner Tracker</span></h1>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <a class="help-btn" href="mailto:psy@xfer.au?subject=Partner%20Tracker%20Help">❓ Confused about anything?</a>
    </div>
  </div>
</header>
<div class="toolbar">
  <div class="toolbar-inner">
    <div class="search-box"><input type="text" id="search" placeholder="Search partners, grants, sponsors..." autocomplete="off"></div>
    <div class="filter-group">
      <select id="filter-status">
        <option value="all">All Statuses</option>
        <option value="new">🔵 New</option>
        <option value="contacted">🟡 Contacted</option>
        <option value="interested">🟢 In Progress / App Sent</option>
        <option value="not-interested">🔴 Rejected</option>
        <option value="no-answer">⚪ No Answer</option>
        <option value="done">✅ Secured</option>
      </select>
      <select id="filter-category"><option value="all">All Categories</option></select>
      <select id="filter-contact">
        <option value="all">All Contact Types</option>
        <option value="direct">Has Email/Phone</option>
        <option value="form-only">Website Only</option>
      </select>
    </div>
  </div>
</div>
<div class="stats-bar" id="stats-bar" style="max-width:1440px;margin:0 auto;padding:12px 24px;display:flex;gap:12px;flex-wrap:wrap;font-size:0.8rem"></div>
<main class="main" id="main"><div class="card-grid" id="card-grid"></div></main>
<div class="modal-overlay" id="modal-overlay"><div class="modal" id="modal"><button class="modal-close" id="modal-close">&times;</button><div id="modal-content"></div></div></div>
<script>${data1}</script>
<script>${data2}</script>
<script>${data3}</script>
<script>${js}</script>
</body>
</html>`;

const out=path.join(dir,'charity-tracker-portable.html');
fs.writeFileSync(out,html,'utf8');
console.log('Bundled:',out);
console.log('Size:',(Buffer.byteLength(html)/1024).toFixed(1),'KB');
