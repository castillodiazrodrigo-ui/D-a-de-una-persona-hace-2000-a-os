// Render fotograma a fotograma (Canvas 2D en Chromium headless), en paralelo
const { chromium } = require('playwright'); const { start } = require('../../render/server.js'); const fs = require('fs'), path = require('path');
const a = process.argv.slice(2); const get = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const FPS = 30, WORKERS = +get('workers', 3), OUT = path.join(__dirname, '../out/frames'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const total = Math.ceil(71.000813 * FPS - 1e-6), from = +get('from', 0), to = Math.min(total, +get('to', total));
  const todo = []; for (let f = from; f < to; f++) if (a.includes('--force') || !fs.existsSync(path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`))) todo.push(f);
  console.log(`${todo.length} fotogramas`); let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.error('[err]', e.message));
    await p.goto(`http://127.0.0.1:${port}/ep1/index.html`); await p.waitForFunction('window.ready===true');
    while (next < todo.length) { const f = todo[next++]; await p.evaluate(t => window.renderFrame(t), f / FPS); await p.screenshot({ path: path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 }); if (++done % 300 === 0) console.log(done, ((Date.now() - t0) / done).toFixed(0), 'ms/f'); }
    await b.close();
  }));
  console.log('listo en', ((Date.now() - t0) / 1000).toFixed(0), 's'); srv.close();
})();
