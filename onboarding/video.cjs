// Turns the recorded walkthrough clips into one branded MP4: Madvert intro card, the funnel on a phone,
// the CRM on a desktop (when recorded), and a closing card. Landscape 1920x1080: the CRM fills the frame and the
// phone clips sit in the middle.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const RAW = path.join(OUT, 'video-raw');
const TMP = path.join(OUT, 'video-tmp');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const file = (p) => 'file://' + p;
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

const card = (title, sub, kicker) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Mont;src:url(${file(path.join(__dirname, '..', 'app', 'fonts', 'montserrat-latin-800-normal.woff2'))})}
body{margin:0;width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
background:radial-gradient(90% 50% at 100% 0%,#d9f7fd 0%,#fff 60%),#fff;font-family:Mont,Arial;color:#0b0b12}
img.ml{width:760px}
.k{margin-top:60px;font-size:26px;letter-spacing:5px;color:#fff;background:linear-gradient(90deg,#1468f5,#18d6f2);padding:14px 30px;border-radius:999px;text-transform:uppercase}
h1{font-size:84px;line-height:1.08;margin:34px 70px 20px}
p{font-size:36px;color:#5a6272;margin:0 200px;line-height:1.4;font-family:Arial}
img.cl{width:150px;margin-top:50px}
</style></head><body><img class="ml" src="${file(path.join(__dirname, 'assets', 'madvert-logo.png'))}">
<div class="k">${kicker}</div><h1>${title}</h1><p>${sub}</p><img class="cl" src="${file(path.join(__dirname, '..', 'public', 'assets', 'logo-512.webp'))}"></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const cards = {
    intro: card('Your Lead System Is Live', `${cfg.clientName}: your quote funnel, emails, WhatsApp and CRM in 2 minutes.`, 'Client walkthrough'),
    outro: card('You Are All Set', `Log in at ${cfg.crmHost} and reply to new leads within 5 minutes.`, 'Madvert Marketing Team'),
  };
  for (const [k, html] of Object.entries(cards)) {
    const htmlFile = path.join(TMP, `${k}.html`);
    fs.writeFileSync(htmlFile, html);
    await p.goto(file(htmlFile), { waitUntil: 'load' });
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(TMP, `${k}.png`) });
  }
  await b.close();

  const enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-an'];
  ff(['-loop', '1', '-t', '3.5', '-i', path.join(TMP, 'intro.png'), '-vf', 'scale=1920:1080', ...enc, path.join(TMP, '0-intro.mp4')]);
  ff(['-loop', '1', '-t', '3.5', '-i', path.join(TMP, 'outro.png'), '-vf', 'scale=1920:1080', ...enc, path.join(TMP, '9-outro.mp4')]);

  // Each recorded clip, scaled into the vertical frame on the Madvert background colour.
  const clips = fs.readdirSync(RAW).filter((f) => f.endsWith('.webm') && fs.statSync(path.join(RAW, f)).size > 0).sort((a, c) => fs.statSync(path.join(RAW, a)).mtimeMs - fs.statSync(path.join(RAW, c)).mtimeMs);
  clips.forEach((f, i) => {
    // Phone clips were recorded on a taller canvas than the phone screen: keep only the screen.
    const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(RAW, f)]).toString().trim().split(',').map(Number);
    const crop = w === 390 && h === 844 ? 'crop=390:664:0:0,' : '';
    ff(['-i', path.join(RAW, f), '-vf', crop + 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0b0b12', ...enc, path.join(TMP, `${i + 1}-clip.mp4`)]);
  });
  const parts = fs.readdirSync(TMP).filter((f) => f.endsWith('.mp4')).sort();
  fs.writeFileSync(path.join(TMP, 'list.txt'), parts.map((f) => `file '${path.join(TMP, f)}'`).join('\n'));
  const name = `${cfg.clientName.replace(/[^A-Za-z0-9]+/g, '-')}-Walkthrough.mp4`;
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(TMP, 'list.txt'), '-c', 'copy', '-movflags', '+faststart', path.join(OUT, name)]);
  console.log('video', name, parts.length, 'parts');
})();
