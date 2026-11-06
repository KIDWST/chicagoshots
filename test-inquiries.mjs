import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const script=fs.readFileSync('script.js','utf8');
async function fixture(dnt=false){
 const calls=[],listeners={},classes=new Set(),values=new Map();let fail=true;
 const form={dataset:{endpoint:'https://app.phantomforce.online/api/public/chicagoshots/inquiries'},classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},addEventListener:(k,v)=>listeners[k]=v,reportValidity:()=>true,reset:()=>{}};
 const location={search:'?utm_source=instagram&utm_campaign=private@example.com',pathname:'/',origin:'https://chicagoshots.com'};
 const context={URL,URLSearchParams,Date,Math,console,crypto:{randomUUID},location,navigator:{doNotTrack:dnt?'1':'0'},sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},FormData:class{entries(){return [['name','Private Client'],['email','private@example.com']];}},fetch:async(url,options)=>{calls.push({url,payload:JSON.parse(options.body),options});if(url.endsWith('/inquiries')){const ok=!fail;fail=false;return {ok,json:async()=>({ok})};}return {ok:true,json:async()=>({ok:true})};},document:{referrer:'https://instagram.com/secret?token=private',body:{classList:{remove(){}}},querySelector:s=>s==='[data-inquiry]'?form:s==='[data-year]'?{}:null,addEventListener:(k,v)=>listeners['document-'+k]=v},window:{location,scrollY:0,addEventListener(){}}};
 vm.runInNewContext(script,context);await listeners.submit({preventDefault(){}});await listeners.submit({preventDefault(){}});
 const inquiries=calls.filter(c=>c.url.endsWith('/inquiries'));assert.equal(inquiries.length,2);assert.equal(inquiries[0].payload.idempotency_key,inquiries[1].payload.idempotency_key,'retry keeps its idempotency key');
 const analytics=calls.filter(c=>c.url.endsWith('/website-events'));
 if(dnt){assert.equal(analytics.length,0);assert.equal(values.size,0);}else{assert.deepEqual(analytics.map(c=>c.payload.event),['page_view','inquiry_submit']);assert.equal(analytics[0].payload.source,'instagram');assert.equal(analytics[0].payload.campaign,'');for(const c of analytics){assert(!JSON.stringify(c.payload).includes('private'));assert.equal(c.options.credentials,'omit');}}
}
await fixture();await fixture(true);console.log('PASS website retry, success-only conversion, attribution privacy, and Do Not Track');
