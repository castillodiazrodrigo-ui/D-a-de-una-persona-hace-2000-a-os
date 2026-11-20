// Exporta los SFX sincronizados (audio/cues.json) y la lista de planos
const { chromium } = require('playwright'); const { start } = require('../../render/server.js'); const fs = require('fs'), path = require('path');
(async () => { const srv = await start(0); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`http://127.0.0.1:${srv.address().port}/ep1/index.html`); await p.waitForFunction('window.ready===true');
  const cues = await p.evaluate(() => window.collectCues()); const shots = await p.evaluate(() => window.shotList());
  fs.writeFileSync(path.join(__dirname, '../audio/cues.json'), JSON.stringify(cues, null, 1)); fs.writeFileSync(path.join(__dirname, '../out/shots.json'), JSON.stringify(shots, null, 1));
  console.log(cues.length, 'cues', shots.length, 'planos'); await b.close(); srv.close(); })();
