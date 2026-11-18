// =====================================================================
//  RENDERIZADO: captura determinista fotograma a fotograma en Chromium
//  headless (WebGL/SwiftShader) con varios procesos en paralelo.
//  Uso: node render/render.js [--fps 30] [--workers 3] [--from 0] [--to N]
//       node render/render.js --cues   (sólo exporta los SFX sincronizados)
// =====================================================================
const { chromium } = require('playwright'); const { start } = require('./server.js');
const fs = require('fs'), path = require('path');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : null).filter(Boolean));
const FPS = +(args.fps || 30), WORKERS = +(args.workers || 3);
const OUT = path.resolve(__dirname, '../out/frames'); fs.mkdirSync(OUT, { recursive: true });
const LAUNCH = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };

async function openPage(port, warm = true) {
  const b = await chromium.launch(LAUNCH);
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html${warm ? '' : '?nowarm=1'}`);
  await p.waitForFunction('window.ready===true', null, { timeout: 600000 });
  return { b, p };
}
(async () => {
  const srv = await start(0); const port = srv.address().port;
  if (args.cues) {
    const { b, p } = await openPage(port, false);
    const cues = await p.evaluate(() => window.collectCues());
    const shots = await p.evaluate(() => window.shotList());
    fs.writeFileSync(path.resolve(__dirname, '../audio/cues.json'), JSON.stringify(cues, null, 1));
    fs.writeFileSync(path.resolve(__dirname, '../out/shots.json'), JSON.stringify(shots, null, 1));
    console.log('cues:', cues.length, 'shots:', shots.length); await b.close(); srv.close(); return;
  }
  const dur = 67.78775; const total = Math.ceil(dur * FPS - 1e-6);
  const from = +(args.from || 0), to = Math.min(total, +(args.to || total));
  const todo = []; for (let f = from; f < to; f++) if (args.force || !fs.existsSync(path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`))) todo.push(f);
  console.log(`frames ${from}-${to} (${todo.length} pendientes) a ${FPS} fps con ${WORKERS} procesos`);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const { b, p } = await openPage(port);
    while (next < todo.length) {
      const f = todo[next++]; const t = f / FPS;
      await p.evaluate(t => window.renderFrame(t), t);
      await p.screenshot({ path: path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
      done++; if (done % 50 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${done}/${todo.length}  ${(el / done).toFixed(2)} s/f  ETA ${((todo.length - done) * el / done / 60).toFixed(1)} min`); }
    }
    await b.close();
  }));
  console.log('listo en', ((Date.now() - t0) / 60000).toFixed(1), 'min'); srv.close();
})();
