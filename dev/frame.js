// node dev/frame.js t1,t2,... outprefix  -> capturas de fotogramas concretos
const { chromium } = require('playwright'); const { start } = require('../render/server.js');
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.log('[err]', e.message, e.stack));
  await p.goto(`http://127.0.0.1:${port}/index.html?nowarm=1`); await p.waitForFunction('window.ready===true', null, { timeout: 300000 });
  const ts = process.argv[2].split(',').map(Number); const pre = process.argv[3]; const scale = +(process.argv[4] || .5);
  for (const t of ts) { const t0 = Date.now(); const id = await p.evaluate(t => window.renderFrame(t), t); await p.screenshot({ path: `${pre}_${t.toFixed(2)}.jpg`, quality: 80, scale: 'css', clip: { x: 0, y: 0, width: 1080, height: 1920 } }); console.log(t, id, Date.now() - t0, 'ms'); }
  await b.close(); srv.close();
})();
