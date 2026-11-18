const { chromium } = require('playwright'); const { start } = require('../render/server.js');
(async () => { const srv = await start(0); const b = await chromium.launch({ args: process.env.ARGS.split(' ') });
 const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p.goto('http://127.0.0.1:'+srv.address().port+'/dev/micro.html'); await p.waitForFunction('window.done===true');
 console.log(process.env.ARGS.slice(0,50), await p.evaluate(()=>JSON.stringify(window.out))); await b.close(); srv.close(); })();
