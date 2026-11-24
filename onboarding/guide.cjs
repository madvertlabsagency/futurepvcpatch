// Builds the branded Madvert Labs onboarding guide (A4 PDF) from the screenshots in onboarding/out/shots.
// Pages whose screenshots are missing are left out, so it can run before every capture is done.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const SHOTS = path.join(OUT, 'shots');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const lead = JSON.parse(fs.readFileSync(path.join(OUT, 'lead.json'), 'utf8'));

const file = (p) => 'file://' + p;
const shot = (name) => {
  const f = fs.readdirSync(SHOTS).find((x) => x.endsWith(name + '.png') || x === name + '.png');
  return f ? file(path.join(SHOTS, f)) : null;
};
const font = (n) => file(path.join(ROOT, 'app', 'fonts', n));
const madvertLogo = file(path.join(__dirname, 'assets', 'madvert-logo.png'));
const clientLogo = file(path.join(ROOT, 'public', 'assets', 'logo-512.webp'));
const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// One page = a title, an intro line, then blocks. A block is a list of screenshots with captions.
const phones = (items) =>
  `<div class="phones">${items
    .filter(([n]) => shot(n))
    .map(([n, t]) => `<figure><img src="${shot(n)}"><figcaption>${t}</figcaption></figure>`)
    .join('')}</div>`;
const wide = (n, t) => (shot(n) ? `<figure class="wide"><img src="${shot(n)}"><figcaption>${t}</figcaption></figure>` : '');
const page = (num, kicker, title, intro, body) => `
<section class="page">
  <header><img class="ml" src="${madvertLogo}"><span>${cfg.clientName} · Lead System Guide</span></header>
  <div class="kicker">${kicker}</div>
  <h2>${title}</h2>
  ${intro ? `<p class="intro">${intro}</p>` : ''}
  ${body}
  <footer><span>Madvert Labs · Digital Marketing &amp; Growth Systems</span><span>${num}</span></footer>
</section>`;

const tip = (t) => `<div class="tip"><span class="tl">Tip</span>${t}</div>`;
const steps = (list) => `<ol class="steps">${list.map((s) => `<li>${s}</li>`).join('')}</ol>`;

const pages = [];
let n = 2;
const add = (...a) => pages.push(page(n++, ...a));

add(
  'Overview',
  'How your lead system works',
  'Every quote request goes through the same simple path. Nothing gets lost, and you are told about every lead the moment it arrives.',
  `<div class="flow">
    ${[
      ['Ad', 'Your Facebook and Instagram ads bring patch buyers in the US.'],
      ['Funnel', `They request a free quote at ${cfg.funnelHost} in about a minute.`],
      ['WhatsApp', `One tap opens a chat with your WhatsApp (${cfg.whatsapp}).`],
      ['Emails + PDF', 'The customer gets a confirmation with a PDF. You get an instant new lead email.'],
      ['CRM', `The lead lands in your CRM at ${cfg.crmHost}, ready to follow up.`],
    ]
      .map(([h, t], i) => `<div class="node"><span>${i + 1}</span><b>${h}</b><p>${t}</p></div>`)
      .join('')}
  </div>
  <div class="cards">
    <div><b>Your quote funnel</b><p>${cfg.funnelUrl}</p></div>
    <div><b>Your CRM</b><p>${cfg.crmUrl}/login</p></div>
    <div><b>New lead emails go to</b><p>${cfg.clientEmail}</p></div>
    <div><b>Customer WhatsApp chats come to</b><p>${cfg.whatsapp}</p></div>
  </div>`,
);

add(
  'Step 1 · The funnel',
  'What your customer sees',
  'This is the page your ads send people to. Your offer is the first thing they read, and the quote form starts right under the headline.',
  phones([
    ['funnel-hero', 'The first screen on a phone: your offer and step 1 of the quote.'],
    ['form-step2-quantity', 'They choose how many patches they need.'],
    ['form-step3-size', 'Then the size in inches (or "not sure yet").'],
  ]),
);
add(
  'Step 1 · The funnel',
  'Seven quick steps, about a minute',
  'Each step is one simple choice, so most visitors finish. Their answers are saved as they go.',
  phones([
    ['form-step4-backing', 'Backing: iron on, sew on, velcro and more.'],
    ['form-step5-artwork', 'They upload their logo or artwork, or ask for design help.'],
    ['form-step6-deadline', 'Their deadline and any notes for your team.'],
  ]),
);
add(
  'Step 2 · The request',
  'Contact details and WhatsApp',
  'Last, they enter their name, email and WhatsApp number, then tap Request my free quote.',
  phones([
    ['form-step7-contact', 'Contact details and how they prefer to be contacted.'],
    ['thank-you', 'The thank you page asks them to verify on WhatsApp.'],
    ['thank-you-summary', 'They see a summary of everything they sent.'],
  ]) +
    tip(
      `When the customer taps <b>Verify on WhatsApp</b>, a chat with your number opens with a message like <i>"Hi ${cfg.clientName}, my quote code is ${(lead.last && lead.last.code) || 'FPP-123456'}"</i>. Reply in that chat with their price and mockup.`,
    ),
);
add(
  'Step 3 · Emails',
  'The email your customer receives',
  'Right after they submit, the customer gets a confirmation with their full request, a WhatsApp button and a branded PDF of their quote request with their artwork.',
  `<div class="two">${wide('email-customer', 'Customer confirmation email')}${wide('pdf-1', 'The quote request PDF attached to it')}</div>`,
);
add(
  'Step 3 · Emails',
  'The email you receive for every new lead',
  `Every new lead is emailed to ${cfg.clientEmail} within seconds, with one-tap buttons to WhatsApp or call the customer, their artwork and the PDF.`,
  `<div class="two">${wide('email-owner', 'Your new lead alert')}${wide('email-nudge', 'A reminder the customer gets after 10 minutes if they have not messaged you on WhatsApp')}</div>` +
    tip('Leads contacted within 5 minutes are far more likely to order. Tap <b>WhatsApp customer</b> in this email and reply right away.'),
);
if (shot('crm-login'))
  add(
    'Step 4 · Your CRM',
    'Logging in',
    `Open ${cfg.crmUrl}/login on your phone or computer and sign in with the email and password we sent you.`,
    `<div class="one">${wide('crm-login', 'The CRM sign in page')}</div>` +
      steps([
        'Sign in with your email and password.',
        'Change your password the first time you log in (Accounts page, Change password).',
        'On your phone, install the CRM as an app: tap Install app (on iPhone: Share, then Add to Home Screen).',
        'Turn on notifications so you hear a cha-ching for every new quote request.',
      ]),
  );
if (shot('crm-welcome'))
  add('Step 4 · Your CRM', 'Your welcome page', 'The first time you sign in, a welcome page shows your four first steps: add your team, work your pipeline, keep notes on every lead, and turn on notifications.', `<div class="one">${wide('crm-welcome', 'Your CRM welcome page')}</div>`);
if (shot('crm-pipeline'))
  add('Step 4 · Your CRM', 'The pipeline', 'Every new quote lands in New RFQ. Move it along with the arrows as you work it: Contacted, Quote Sent, then Won or Lost.', `<div class="one">${wide('crm-pipeline', 'Your pipeline')}</div>`);
if (shot('crm-lead'))
  add(
    'Step 4 · Your CRM',
    'Inside a lead',
    'Open any lead to see everything about it in one place.',
    `<div class="one">${wide('crm-lead', 'A lead: details, lead score, artwork and the quote PDF')}</div>` +
      steps(['Add a note after every call or chat, so your team always knows the latest.', 'Add a task with a due date for each follow-up.', 'Assign the lead to a salesperson, and add the order value when you quote.']),
  );
if (shot('crm-dashboard')) add('Step 4 · Your CRM', 'Your dashboard', 'Your numbers at a glance: leads, pipeline value, won and lost revenue, and your conversion ratios.', `<div class="one">${wide('crm-dashboard', 'The dashboard')}</div>`);
if (shot('crm-tasks') || shot('crm-notifications'))
  add('Step 4 · Your CRM', 'Tasks and notifications', 'Never miss a follow-up: tasks show what is due today and overdue, and notifications flag new leads and leads waiting too long. Install the app and turn on notifications from this page.', `<div class="one">${wide('crm-notifications', 'Notifications: new leads, leads waiting too long, and the app and notification settings')}</div><div class="one" style="margin-top:6mm">${wide('crm-tasks', 'Tasks')}</div>`);
if (shot('crm-team')) add('Step 4 · Your CRM', 'Your team', 'Add your salespeople with their own login. Each one sees the leads of your account only.', `<div class="one">${wide('crm-team', 'Team settings')}</div>`);

add(
  'Best practices',
  'Getting the most from every lead',
  '',
  `<div class="cards big">
    <div><b>1. Reply within 5 minutes</b><p>Speed wins the order. Keep CRM notifications on and answer new leads on WhatsApp first.</p></div>
    <div><b>2. Send the mockup within 24 hours</b><p>Your funnel promises a free mockup in 24 hours. Keeping that promise builds trust before the price.</p></div>
    <div><b>3. Move every lead in the pipeline</b><p>Mark leads Contacted, Quote Sent, Won or Lost. It keeps your team in sync and your numbers accurate.</p></div>
    <div><b>4. Note every conversation</b><p>A short note after each call or chat means anyone can pick up the lead.</p></div>
    <div><b>5. Follow up with tasks</b><p>Most orders close on the second or third follow-up. Add a task for each one.</p></div>
    <div><b>6. Tell us what you hear</b><p>Questions customers ask and why they buy help us improve your ads and funnel.</p></div>
  </div>
  <div class="contact"><b>Need help?</b> Reply to our email or message the Madvert Marketing Team any time.</div>`,
);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Mont;src:url(${font('montserrat-latin-800-normal.woff2')});font-weight:800}
@font-face{font-family:Mont;src:url(${font('montserrat-latin-700-normal.woff2')});font-weight:700}
@font-face{font-family:Man;src:url(${font('manrope-latin-400-normal.woff2')});font-weight:400}
@font-face{font-family:Man;src:url(${font('manrope-latin-600-normal.woff2')});font-weight:600}
@font-face{font-family:Man;src:url(${font('manrope-latin-700-normal.woff2')});font-weight:700}
:root{--ink:#0b0b12;--blue:#1468f5;--cyan:#18d6f2;--muted:#5a6272;--line:#e3e8f0;--soft:#f3f7fd}
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:Man,Arial,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;padding:16mm 15mm 18mm;position:relative;page-break-after:always;overflow:hidden;background:#fff}
.page header{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:10mm}
.page header .ml{height:26px}
.page footer{position:absolute;left:15mm;right:15mm;bottom:9mm;display:flex;justify-content:space-between;font-size:9.5px;color:var(--muted);border-top:1px solid var(--line);padding-top:6px}
.kicker{display:inline-block;font:700 10.5px Mont,Arial;letter-spacing:2px;text-transform:uppercase;color:#fff;background:linear-gradient(90deg,var(--blue),var(--cyan));padding:5px 11px;border-radius:999px}
h2{font:800 26px/1.15 Mont,Arial;margin:9px 0 6px;letter-spacing:-.3px}
.intro{font-size:13.5px;line-height:1.55;color:var(--muted);margin:0 0 7mm;max-width:165mm}
.phones{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm}
.phones figure{margin:0}
.phones img{width:100%;border-radius:16px;border:1px solid var(--line);box-shadow:0 10px 26px rgba(11,11,18,.12);display:block}
figcaption{font-size:11.5px;line-height:1.45;color:var(--ink);margin-top:3mm}
.two{display:grid;grid-template-columns:1fr 1fr;gap:7mm;align-items:start}
.one .wide img,.two .wide img{width:100%;border-radius:12px;border:1px solid var(--line);box-shadow:0 10px 26px rgba(11,11,18,.10);display:block;max-height:175mm;object-fit:contain;object-position:top left;object-position:top;background:#fff}
.wide{margin:0}
.tip{margin-top:7mm;background:var(--soft);border-left:5px solid var(--blue);padding:4mm 5mm;border-radius:10px;font-size:12px;line-height:1.55}
.tip .tl{display:block;font:700 11px Mont,Arial;letter-spacing:1.5px;text-transform:uppercase;color:var(--blue);margin-bottom:2px}
.steps{margin:7mm 0 0;padding-left:5mm;font-size:12.5px;line-height:1.75}
.flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3mm;margin:4mm 0 10mm;counter-reset:x}
.node{position:relative;background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:5mm 4mm;text-align:center}
.node span{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--cyan));color:#fff;font:800 13px Mont,Arial}
.node b{display:block;font:700 13px Mont,Arial;margin:3mm 0 2mm}
.node p{margin:0;font-size:10.5px;line-height:1.45;color:var(--muted);overflow-wrap:anywhere}
.arrow{align-self:center;color:var(--blue);font:800 18px Mont,Arial}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.cards div{border:1px solid var(--line);border-radius:14px;padding:5mm}
.cards b{font:700 13px Mont,Arial}
.cards p{margin:2mm 0 0;font-size:12px;line-height:1.5;color:var(--muted);word-break:break-all}
.cards.big p{word-break:normal}
.contact{margin-top:9mm;background:var(--ink);color:#fff;border-radius:14px;padding:6mm;font-size:13px}
.contact b{color:var(--cyan)}
.cover{background:radial-gradient(120% 70% at 100% 0%,#d9f7fd 0%,#fff 45%),#fff;display:flex;flex-direction:column}
.cover .top{display:flex;justify-content:center;margin-top:24mm}
.cover .top img{width:140mm}
.cover .mid{margin:auto 0;text-align:center}
.cover .mid .kicker{font-size:12px}
.cover h1{font:800 40px/1.1 Mont,Arial;margin:6mm 0 4mm;letter-spacing:-.5px}
.cover .sub{font-size:15px;color:var(--muted);margin:0}
.cover .client{display:inline-flex;align-items:center;gap:5mm;margin-top:12mm;border:1px solid var(--line);border-radius:18px;padding:5mm 8mm;background:#fff}
.cover .client img{width:22mm}
.cover .client b{font:800 18px Mont,Arial;display:block;text-align:left}
.cover .client span{font-size:12px;color:var(--muted)}
.cover .bottom{text-align:center;font-size:11px;color:var(--muted);margin-bottom:6mm}
</style></head><body>
<section class="page cover">
  <div class="top"><img src="${madvertLogo}"></div>
  <div class="mid">
    <span class="kicker">Client onboarding guide</span>
    <h1>Your Lead System<br>Is Live</h1>
    <p class="sub">Your quote funnel, emails, WhatsApp and CRM, step by step.</p>
    <div class="client"><img src="${clientLogo}"><div><b>${cfg.clientName}</b><span>Prepared ${today}</span></div></div>
  </div>
  <div class="bottom">Madvert Labs · Digital Marketing &amp; Growth Systems</div>
</section>
${pages.join('\n')}
</body></html>`;

(async () => {
  fs.writeFileSync(path.join(OUT, 'guide.html'), html);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(file(path.join(OUT, 'guide.html')), { waitUntil: 'load' });
  await p.waitForTimeout(800);
  const name = `${cfg.clientName.replace(/[^A-Za-z0-9]+/g, '-')}-Lead-System-Guide.pdf`;
  await p.pdf({ path: path.join(OUT, name), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('guide', name, pages.length + 1, 'pages');
})();
