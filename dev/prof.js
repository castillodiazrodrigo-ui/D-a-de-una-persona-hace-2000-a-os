const { chromium } = require('playwright'); const { start } = require('../render/server.js');
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html?nowarm=1`); await p.waitForFunction('window.ready===true', null, { timeout: 300000 });
  const t = +(process.argv[2]||1);
  for (let i = 0; i < 3; i++) {
    const r = await p.evaluate((t) => { const a = performance.now(); window.renderFrame(t); const gl = document.getElementById('gl').getContext('webgl2'); const px = new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); return performance.now() - a; }, t + i * .033);
    const a = Date.now(); await p.screenshot({ type: 'jpeg', quality: 90 }); console.log('render', r.toFixed(0), 'shot', Date.now() - a);
  }
  await b.close(); srv.close();
})();
