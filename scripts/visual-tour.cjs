const puppeteer = require('puppeteer-core');
const fs = require('node:fs');
(async()=>{
 const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage(); const out=process.env.TOUR_OUT||'C:/hermes/qa/languago-before'; fs.mkdirSync(out,{recursive:true}); const results=[];
 for(const width of [1440,390]){await page.setViewport({width,height:950}); for(const route of ['/','/ogren','/signin','/materyal-uretici','/sinif-oyunu']){const errors=[]; page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TOUR_BASE||'https://www.languago.site')+route,{waitUntil:'networkidle2',timeout:60000});const name=(route==='/'?'home':route.slice(1))+'-'+width;await page.screenshot({path:out+'/'+name+'.png',fullPage:true});results.push({route,width,url:page.url(),title:await page.title(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),text:await page.evaluate(()=>document.body.innerText),errors});}}
 fs.writeFileSync(out+'/tour.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({text,...r})=>({...r,text:text.slice(0,450)})),null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
