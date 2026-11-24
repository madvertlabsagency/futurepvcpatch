// Onboarding walkthrough capture: drives the live funnel and the CRM like a real customer and client,
// saves a screenshot of every step and records captioned videos for the walkthrough.
// Usage (from the repo root):
//   CRM_EMAIL=... CRM_PASSWORD=... node onboarding/capture.cjs
// Config is in onboarding/config.json. It submits ONE sample lead (first name from config) on the live funnel.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const OUT = path.join(__dirname, 'out');
const SHOTS = path.join(OUT, 'shots');
const VID = path.join(OUT, 'video-raw');
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(VID, { recursive: true });

// A caption bar drawn on top of the page, so the recorded video explains each step on its own.
const CAPTION = `
  window.__cap = (text) => {
    let el = document.getElementById('__cap');
    if (!el) {
      el = document.createElement('div');
      el.id = '__cap';
      el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:18px;z-index:2147483647;background:rgba(10,14,30,.92);color:#fff;font:600 17px/1.35 system-ui,Segoe UI,Arial;padding:14px 16px;border-radius:14px;border-left:6px solid #18c8f0;box-shadow:0 10px 30px rgba(0,0,0,.35);pointer-events:none';
      document.documentElement.appendChild(el);
    }
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
  };`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
async function shot(page, name, opts = {}) {
  await page.evaluate(() => window.__cap && window.__cap('')).catch(() => {});
  const file = path.join(SHOTS, `${String(++n).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, ...opts });
  console.log('shot', path.basename(file));
}
async function cap(page, text, ms = 2600) {
  await page.evaluate((t) => window.__cap(t), text).catch(() => {});
  await sleep(ms);
  // Clear it, so a caption never stays on screen over the next step.
  await page.evaluate(() => window.__cap('')).catch(() => {});
}

async function funnel(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], recordVideo: { dir: VID, size: devices['iPhone 13'].viewport } });
  await ctx.addInitScript(CAPTION);
  await ctx.addInitScript(() => {
    // Hide the browser automation flag the site's analytics may count, and skip the cookie of a real visitor.
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const p = await ctx.newPage();
  await p.goto(cfg.funnelUrl + '?utm_source=onboarding-guide', { waitUntil: 'networkidle' });
  await sleep(800);
  await shot(p, 'funnel-hero');
  await cap(p, `1. Your ad sends customers to ${cfg.funnelHost}. They see your offer and start a free quote right away.`, 3500);

  // Step 1 from the quiz above the fold, like most visitors do.
  await cap(p, '2. They pick their patch type...', 1800);
  await p.locator('.hq-mobile a.hq-opt', { hasText: cfg.sample.patchType }).first().click();
  await sleep(1200);
  await p.locator('#quote').scrollIntoViewIfNeeded();
  await sleep(600);
  await shot(p, 'form-step2-quantity');
  await cap(p, '...how many they need...', 1600);
  await p.locator('#quote button.opt', { hasText: cfg.sample.quantity }).first().click();
  await p.locator('#quote button.next').click();
  await sleep(700);
  await p.locator('#quote input[type=number]').nth(0).fill(cfg.sample.width);
  await p.locator('#quote input[type=number]').nth(1).fill(cfg.sample.height);
  await shot(p, 'form-step3-size');
  await cap(p, '...the size in inches...', 1600);
  await p.locator('#quote button.next').click();
  await sleep(700);
  await shot(p, 'form-step4-backing');
  await cap(p, '...and the backing.', 1600);
  await p.locator('#quote button.opt', { hasText: cfg.sample.backing }).first().click();
  await p.locator('#quote button.next').click();
  await sleep(700);
  await cap(p, '3. They upload their logo or artwork (PNG, JPG, PDF, AI, EPS or SVG).', 1500);
  await p.locator('#quote input[type=file]').setInputFiles(path.join(__dirname, 'assets', 'sample-artwork.png'));
  await p.waitForFunction(() => !document.querySelector('#quote .file .bar, #quote [data-state="uploading"]'), null, { timeout: 30000 }).catch(() => {});
  await sleep(3500);
  await shot(p, 'form-step5-artwork');
  await p.locator('#quote button.next').click();
  await sleep(700);
  await p.locator('#quote button.opt', { hasText: cfg.sample.deadline }).first().click();
  await p.locator('#quote textarea').fill(cfg.sample.notes);
  await shot(p, 'form-step6-deadline');
  await cap(p, '4. Their deadline and any notes...', 1800);
  await p.locator('#quote button.next').click();
  await sleep(700);
  const fld = (label) => p.locator('#quote label.fld', { hasText: label }).locator('input');
  await fld('First name').fill(cfg.sample.firstName);
  await fld('Last name').fill(cfg.sample.lastName);
  await fld('Business name').fill(cfg.sample.business);
  await fld('Email').fill(cfg.sample.email);
  await p.locator('#quote input[type=tel]').fill(cfg.sample.phone);
  await p.locator('#quote button.opt', { hasText: 'WhatsApp' }).first().click();
  await p.locator('#quote input[type=checkbox]').last().check();
  await shot(p, 'form-step7-contact');
  await cap(p, '5. ...and their contact details. Then they tap Request my free quote.', 2600);
  await p.locator('#quote button.submit').click();
  await p.waitForURL(/thank-you/, { timeout: 45000 });
  await sleep(2500);
  await shot(p, 'thank-you');
  await cap(p, '6. The thank you page asks them to verify on WhatsApp. One tap opens a chat with YOUR WhatsApp, with their quote code already typed.', 5000);
  const wa = await p.locator('a.wa-btn').getAttribute('href').catch(() => '');
  const last = await p.evaluate(() => JSON.parse(sessionStorage.getItem('cpl-last') || 'null'));
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await sleep(1500);
  await shot(p, 'thank-you-summary');
  await cap(p, 'Their full request is saved, emailed to them as a PDF, and sent to you and your CRM instantly.', 3500);
  await ctx.close();
  return { wa, last };
}

async function crm(browser, code) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: VID, size: { width: 1440, height: 900 } } });
  await ctx.addInitScript(CAPTION);
  // The CRM's own install and notification prompts are covered on their own page of the guide.
  await ctx.addInitScript(() => {
    try {
      for (const n of ['install', 'ios', 'notify']) localStorage.setItem('crm-prompt-' + n, String(Date.now() + 864e5));
    } catch {}
  });
  const p = await ctx.newPage();
  await p.goto(cfg.crmUrl + '/login', { waitUntil: 'networkidle' });
  await sleep(600);
  await shot(p, 'crm-login');
  await cap(p, `7. Your CRM: log in at ${cfg.crmHost} with your email and password.`, 2800);
  await p.locator('#crm-email').fill(process.env.CRM_EMAIL);
  await p.locator('#admin-password').fill(process.env.CRM_PASSWORD);
  await p.getByRole('button', { name: 'Sign in', exact: true }).click();
  await p.waitForURL(/\/patches(\/|$)(?!login)/, { timeout: 30000 });
  await sleep(1500);
  if (/accounts/.test(p.url())) {
    await p.locator('button[class*=accountCard]', { hasText: cfg.clientName }).first().click();
    await p.waitForURL(/\/patches\/(welcome|$)/, { timeout: 30000 }).catch(() => {});
    await sleep(1200);
  }
  if (/welcome/.test(p.url())) {
    await shot(p, 'crm-welcome');
    await cap(p, 'A welcome page shows what to do today.', 2500);
  }
  await p.goto(cfg.crmUrl, { waitUntil: 'networkidle' });
  await sleep(1200);
  await shot(p, 'crm-pipeline');
  await cap(p, '8. The pipeline: every new quote lands in New RFQ. Use the arrows to move it to Contacted, Quote Sent, Won or Lost.', 4500);
  const card = p.locator('a[href*="/patches/lead/"]', { hasText: cfg.sample.firstName }).first();
  if (await card.count()) {
    await card.click();
    await p.waitForURL(/\/patches\/lead\//, { timeout: 30000 });
    await sleep(1500);
    await shot(p, 'crm-lead');
    await cap(p, `9. Open a lead to see everything: details, score, artwork, the quote PDF, notes, tasks and its full history (${code}).`, 4500);
    await p.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' }));
    await sleep(1200);
    await shot(p, 'crm-lead-lower');
    await cap(p, 'Add notes and tasks, assign it to a teammate, and set the order value.', 3000);
  }
  for (const [route, name, text] of [
    ['/dashboard', 'crm-dashboard', '10. The dashboard: leads, pipeline value, won and lost revenue, and your lead-to-quote and quote-to-sale ratios.'],
    ['/tasks', 'crm-tasks', '11. Tasks: follow-ups due today and overdue, for you and your team.'],
    ['/notifications', 'crm-notifications', '12. Notifications: new leads and leads waiting too long. Turn on phone notifications here and install the CRM as an app.'],
    ['/team', 'crm-team', '13. Team: add your sales people with their own login, and set the value of a new RFQ.'],
  ]) {
    await p.goto(cfg.crmUrl + route, { waitUntil: 'networkidle' });
    await sleep(1200);
    await shot(p, name);
    await cap(p, text, 3500);
  }
  await ctx.close();
}

(async () => {
  if (!process.env.CRM_EMAIL || !process.env.CRM_PASSWORD) throw new Error('Set CRM_EMAIL and CRM_PASSWORD');
  const browser = await chromium.launch();
  let f;
  if (process.env.SKIP_FUNNEL) {
    // CRM only, reusing the sample lead from an earlier run (no new lead on the live funnel).
    f = JSON.parse(fs.readFileSync(path.join(OUT, 'lead.json'), 'utf8'));
    n = 9;
  } else {
    f = await funnel(browser);
    fs.writeFileSync(path.join(OUT, 'lead.json'), JSON.stringify(f, null, 2));
    console.log('lead', f.last && f.last.code);
    await sleep(20000); // the lead reaches the CRM a few seconds after submit
  }
  await crm(browser, f.last && f.last.code);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
