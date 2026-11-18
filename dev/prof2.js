const { chromium } = require('playwright'); const { start } = require('../render/server.js');
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html?nowarm=1`); await p.waitForFunction('window.ready===true', null, { timeout: 300000 });
  await p.evaluate(() => window.renderFrame(1));
  const r = await p.evaluate(() => { 
    const out = {}; const tm = (k, f) => { const a = performance.now(); f(); const gl = document.getElementById('gl').getContext('webgl2'); const px = new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); out[k] = (performance.now() - a) | 0; };
    tm('full', () => window.renderFrame(1.1));
    tm('full2', () => window.renderFrame(1.2));
    return out; });
  console.log(r);
  await b.close(); srv.close();
})();
