// Screenshots of the three real emails (rendered by render.ts) in a simple, neutral inbox frame.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const emails = JSON.parse(fs.readFileSync(path.join(OUT, 'emails.json'), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const frame = (e) => `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;padding:28px}
  .mail{max-width:760px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(15,26,58,.12);overflow:hidden}
  .head{padding:22px 26px;border-bottom:1px solid #e6e9ef}
  .subj{font-size:21px;font-weight:700;color:#14182b;margin:0 0 12px}
  .meta{display:flex;align-items:center;gap:12px;color:#4a5060;font-size:14px}
  .av{width:40px;height:40px;border-radius:50%;background:#1F3B83;color:#fff;display:grid;place-items:center;font-weight:700}
  .att{display:inline-flex;align-items:center;gap:8px;margin-top:14px;border:1px solid #d9dee8;border-radius:10px;padding:8px 12px;font-size:13px;color:#14182b}
  .att b{background:#d93025;color:#fff;border-radius:4px;padding:2px 5px;font-size:11px}
  .body{padding:24px 26px 30px}
</style></head><body><div class="mail"><div class="head">
  <p class="subj">${esc(e.subject)}</p>
  <div class="meta"><div class="av">F</div><div><div><b style="color:#14182b">${esc(e.from.split('<')[0].trim())}</b> &lt;${esc(e.from.split('<')[1] || '')}</div><div>to ${esc(e.to)}</div></div></div>
  ${e.attachment ? `<div class="att"><b>PDF</b>${esc(e.attachment)}</div>` : ''}
</div><div class="body">${e.html}</div></div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 820, height: 900 }, deviceScaleFactor: 2 });
  for (const [key, e] of Object.entries(emails)) {
    await p.setContent(frame(e), { waitUntil: 'load' });
    const el = await p.$('.mail');
    await el.screenshot({ path: path.join(OUT, 'shots', `email-${key}.png`) });
    console.log('email', key);
  }
  await b.close();
})();
