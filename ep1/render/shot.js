// node ep1/render/shot.js t1,t2 outprefix
const { chromium } = require('playwright'); const { start } = require('../../render/server.js');
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.log('[err]', e.message, e.stack));
  await p.goto(`http://127.0.0.1:${port}/ep1/index.html`); await p.waitForFunction('window.ready===true', null, { timeout: 120000 });
  for (const t of process.argv[2].split(',').map(Number)) { const a = Date.now(); const id = await p.evaluate(t => window.renderFrame(t), t); await p.screenshot({ path: `${process.argv[3]}_${t.toFixed(2)}.jpg`, quality: 85 }); console.log(t, id || '', Date.now() - a, 'ms'); }
  await b.close(); srv.close();
})();
