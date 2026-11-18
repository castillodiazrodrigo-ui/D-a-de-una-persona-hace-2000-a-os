const { chromium } = require('playwright'); const { start } = require('../render/server.js');
(async () => {
  const srv = await start(0); const port = srv.address().port;
  const b = await chromium.launch({ args: (process.env.ARGS||'--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist').split(' ') });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('http://127.0.0.1:'+port+'/index.html?nowarm=1'+(process.argv[3]||'')); await p.waitForFunction('window.ready===true');
  const t = +(process.argv[2]||1);
  for (const hide of [false,true]) for (let i=0;i<2;i++){ const r=await p.evaluate(([t,hide])=>{ window.HIDE=hide; const a=performance.now(); window.renderFrame(t); const gl=document.getElementById('gl').getContext('webgl2');const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); return performance.now()-a},[t+i*.1,hide]); console.log('hideToons',hide,r|0); }
  await b.close(); srv.close();
})();
