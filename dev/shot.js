// captura una página de desarrollo: node dev/shot.js <url> <out.png> [w] [h]
const { chromium } = require('playwright'); const { start } = require('../render/server.js');
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const [url, out, w = 1080, h = 1920] = process.argv.slice(2);
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto(`http://127.0.0.1:${port}/${url}`); await p.waitForFunction('window.done===true', null, { timeout: 120000 });
  await p.screenshot({ path: out }); await b.close(); srv.close();
})();
