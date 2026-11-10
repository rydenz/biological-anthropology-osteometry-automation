/* Osteometry element modules.
 * Source: original private "Sex estimation RMIL Tomb 3.xlsx", Humerus Bass,
 * Humerus Spradley, Humerus, Mandible sheets.
 * The original workbook and its specimen records are NOT embedded here.
 */
(function(){
'use strict';
const bridge=window.osteometryBridge;
if(!bridge)return;
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const num=value=>{if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(String(value).trim().replace(',','.'));return Number.isFinite(n)&&n>0?n:null;};
const cleanId=x=>String(x??'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
const key=x=>cleanId(x.individual)+'|'+cleanId(x.number);
const identified=x=>!!cleanId(x.individual)&&!!cleanId(x.number);
const fmt=(n,d=3)=>n===null||n===undefined||!Number.isFinite(n)?'—':n.toFixed(d);
const makeId=()=>('spec_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9));
const esc=escapeHTML;

const HUM_FIELDS=[
 {code:'1',name:'Maximal length',used:'Spradley'},
 {code:'9a',name:'Maximum diameter of head (transverse)',used:'Bass · Spradley'},
 {code:'10a',name:'Maximum vertical diameter of head',used:'Bass · Spradley'},
 {code:'5',name:'Maximum diameter midshaft',used:'Spradley'},
 {code:'6',name:'Minimum diameter midshaft',used:'Source reference table'},
 {code:'4',name:'Epicondylar breadth',used:'Bass · Source reference table'}
];
const HUM_BASS=[
 {code:'10a',name:'Head vertical',female:42.67,male:48.76},
 {code:'9a',name:'Head transverse',female:36.98,male:44.66},
 {code:'4',name:'Epicondylar breadth',female:56.76,male:63.89}
];
function calcSpradley(rec){
 const values=rec?.measurements||{};
 const required=['1','9a','10a','5'];
 const missing=required.filter(code=>num(values[code])===null);
 if(missing.length)return {score:null,missing};
 return {score:.04008*num(values['1'])+.4011*num(values['9a'])+.26862*num(values['10a'])+.62205*num(values['5'])-59.6723,missing:[]};
}
const MAN_FIELDS=[
 {code:'d',name:'Ramus length'},
 {code:'e',name:'Coronoid height'},
 {code:'f',name:'Chin width'},
 {code:'g',name:'Chin height'},
 {code:'h',name:'Condyle width'},
 {code:'i',name:'Bi-gonial breadth'},
 {code:'j',name:'Symphysis height'},
 {code:'k',name:'Antegonial notch area'},
 {code:'l',name:'Body height P1–P2'}
];
const MAN_MODELS={
 FD1:{req:['d','e','f','i','j','k'],expression:'59.59 − 0.30D − 0.24E − 0.15F − 0.25I − 0.27J − 0.04K',
 calc:m=>59.59-.30*m.d-.24*m.e-.15*m.f-.25*m.i-.27*m.j-.04*m.k},
 FD2:{req:['d','e','h','k'],expression:'33.20 − 0.32D − 0.29E − 0.36H − 0.03K',
 calc:m=>33.2-.32*m.d-.29*m.e-.36*m.h-.03*m.k},
 FD3:{req:['f','g','j'],expression:'18.89 − 0.19F + 0.15G − 0.55J',
 calc:m=>18.89-.19*m.f+.15*m.g-.55*m.j},
 FD4:{req:[],expression:'Formula not present in the original workbook.',calc:null},
 FD5:{req:['l'],expression:'11.22 − 0.36L',calc:m=>11.22-.36*m.l}
};
function calcMandible(rec){
 const model=MAN_MODELS[rec?.model]||MAN_MODELS.FD1;
 if(!model.calc)return {score:null,probability:null,sex:null,missing:[],unverified:true};
 const values=rec?.measurements||{};
 const missing=model.req.filter(code=>num(values[code])===null);
 if(missing.length)return {score:null,probability:null,sex:null,missing,unverified:false};
 const input=Object.fromEntries(model.req.map(code=>[code,num(values[code])]));
 const score=model.calc(input);
 const probability=1/(1+Math.exp(-score));
 return {score,probability,sex:score<0?'Male':score>0?'Female':'Indeterminate',missing:[],unverified:false};
}
function fieldHTML(field,value,prefix){
 return '<div class="element-field"><div><div class="element-field-title">'+esc(field.name)+'</div><div class="element-field-code">'+esc(prefix==='humerus'?'Measurement #'+field.code:'Excel column '+field.code.toUpperCase())+'</div></div><div class="control"><label class="element-muted" for="'+prefix+'Measure'+field.code+'">mm / source units</label><input id="'+prefix+'Measure'+field.code+'" data-'+prefix+'-measure="'+esc(field.code)+'" type="number" step="any" min="0" inputmode="decimal" value="'+esc(value??'')+'" placeholder="Enter value"></div></div>';
}
function titleHTML(kicker,title,note){
 return '<div class="element-title-line"><div><div class="eyebrow">'+esc(kicker)+'</div><h2>'+esc(title)+'</h2></div></div>'+(note?'<p class="element-muted">'+esc(note)+'</p>':'');
}
function basicCSV(rows,name){
 const cell=x=>{let s=String(x??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const body='\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
 const link=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
const safeFileName=name=>String(name).replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').toLowerCase();

// Humerus: separate specimen data, independent of the Femur/ Mandible stores.
const H_KEY='osteometry_humerus_v1';
function blankH(){return {individual:'',number:'',locus:'',measurements:{}};}
function normH(input){
 const m={};for(const f of HUM_FIELDS){const raw=input?.measurements?.[f.code];if(raw!==undefined&&raw!==null)m[f.code]=String(raw);}
 return {individual:String(input?.individual||''),number:String(input?.number||''),locus:String(input?.locus||''),measurements:m};
}
function loadHStored(){
 try{const d=JSON.parse(localStorage.getItem(H_KEY)||'null');
 if(d&&typeof d.recordsByContext==='object'&&d.recordsByContext!==null&&typeof d.draftsByContext==='object'&&d.draftsByContext!==null)return d;}catch(e){}
 return {version:1,recordsByContext:{},draftsByContext:{}};
}
let hData=loadHStored(),hContext=null,hRecords=[],hState=blankH(),hSelected=null,hTab='measurements';
function loadHContext(){
 const context=bridge.getContextId();
 if(hContext===context)return;
 hContext=context;
 hRecords=(hData.recordsByContext[context]||[]).map(r=>({...normH(r),id:String(r.id||makeId())}));
 hState=normH(hData.draftsByContext[context]);
 hSelected=hRecords.find(r=>identified(hState)&&key(r)===key(hState))?.id||null;
 ['Individual','Number','Locus'].forEach(n=>{$('humerus'+n).value=hState[n.toLowerCase()]||'';});
 renderH();
}
function persistH(){
 if(!hContext)return true;
 hData.recordsByContext[hContext]=clone(hRecords);
 hData.draftsByContext[hContext]=clone(hState);
 try{localStorage.setItem(H_KEY,JSON.stringify(hData));return true;}catch(e){hNotice('Browser storage is unavailable. Export CSV to keep a copy.');return false;}
}
const hNotice=s=>{$('humerusStatus').textContent=s;};
function saveH(){
 if(!identified(hState)){hNotice('Both Individual and Number are required to save.');return;}
 const duplicate=hRecords.find(r=>key(r)===key(hState)&&r.id!==hSelected);
 if(duplicate){hNotice('This specimen already exists. Open its saved record to edit.');return;}
 if(!hSelected)hSelected=makeId();
 const record={...normH(hState),id:hSelected};
 const idx=hRecords.findIndex(r=>r.id===hSelected);
 if(idx<0)hRecords.push(record);else hRecords[idx]=record;
 const ok=persistH();renderH();bridge.refreshContext();
 hNotice(ok?'Humerus specimen saved locally.':'Local storage failed. Export this table.');
}
function currentHRecords(){
 const records=hRecords.map(r=>clone(r));
 if(identified(hState)){
   const idx=records.findIndex(r=>r.id===hSelected||key(r)===key(hState));
   if(idx>=0)records[idx]={...normH(hState),id:records[idx].id};
   else records.push({...normH(hState),id:'draft'});
 }
 return records;
}
function renderHRows(){
 const body=$('humerusRows');body.replaceChildren();
 $('humerusCount').textContent='('+hRecords.length+')';
 $('humerusEmpty').hidden=hRecords.length>0;
 $('humerusExport').disabled=hRecords.length===0;
 for(const r of hRecords){
  const tr=document.createElement('tr');if(r.id===hSelected)tr.className='selected';
  const score=calcSpradley(r).score;
  const measured=Object.values(r.measurements).filter(x=>num(x)!==null).length;
  tr.innerHTML='<td>'+esc(r.individual)+'</td><td>'+esc(r.number)+'</td><td>'+measured+' / 6</td><td>'+fmt(score,4)+'</td><td></td>';
  const actions=document.createElement('div');actions.className='mandible-table-actions';
  const open=document.createElement('button');open.type='button';open.className='button mini';open.textContent='Open';
  open.addEventListener('click',()=>{hSelected=r.id;hState=normH(r);['Individual','Number','Locus'].forEach(n=>$('humerus'+n).value=hState[n.toLowerCase()]);persistH();renderH();hNotice('Humerus specimen opened.');});
  const remove=document.createElement('button');remove.type='button';remove.className='button mini tertiary';remove.textContent='Delete';
  remove.addEventListener('click',()=>{if(!confirm('Delete Humerus specimen '+r.number+'?'))return;hRecords=hRecords.filter(x=>x.id!==r.id);
  if(hSelected===r.id){hSelected=null;hState=blankH();['Individual','Number','Locus'].forEach(n=>$('humerus'+n).value='');}
  persistH();renderH();bridge.refreshContext();hNotice('Humerus specimen deleted.');});
  actions.append(open,remove);tr.lastElementChild.append(actions);body.append(tr);
 }
}
function hBassHTML(){
 const rows=HUM_BASS.map(m=>{
   const value=num(hState.measurements[m.code]);
   return '<tr><td>'+esc(m.name)+'</td><td>#'+esc(m.code)+'</td><td>'+fmt(value,2)+'</td><td>'+fmt(m.female,2)+'</td><td>'+fmt(m.male,2)+'</td></tr>';
 }).join('');
 return titleHTML('Reference method','Bass · Humerus','Reference values transcribed from the Humerus Bass worksheet.')+
 '<div class="element-table-scroll"><table class="element-bass-table"><thead><tr><th>Measurement</th><th>Code</th><th>Observed</th><th>Female reference</th><th>Male reference</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<div class="element-method-note warning">The workbook includes manually entered Bass sex labels, but no calculation rule for combining the three measurements. The reference values are displayed without inventing an automatic sex classification.</div>'+
 HUM_BASS.map(m=>fieldHTML(HUM_FIELDS.find(f=>f.code===m.code),hState.measurements[m.code],'humerus')).join('');
}
function hSpradleyResults(){
 const calc=calcSpradley(hState);
 return '<div class="element-result-grid"><div class="element-result"><span class="result-caption">Discriminant score</span><strong>'+fmt(calc.score,4)+'</strong></div><div class="element-result"><span class="result-caption">Required measurements</span><strong>'+ (4-calc.missing.length)+' / 4</strong></div></div>'+
 '<div class="element-method-note warning">The source workbook contains a positive score labeled “F” and manually assigned sex labels. Until the original classification threshold and direction are verified, this panel reports the exact score but does not assign sex automatically.</div>';
}
function hSpradleyHTML(){
 return titleHTML('Discriminant function','Spradley · Humerus','Enter or edit any measurement; values are shared with the other Humerus methods.')+
 '<div id="humerusLiveResult">'+hSpradleyResults()+'</div>'+
 ['1','9a','10a','5'].map(code=>fieldHTML(HUM_FIELDS.find(f=>f.code===code),hState.measurements[code],'humerus')).join('')+
 '<div class="element-formula">Score = 0.04008 × length + 0.4011 × maximum head diameter + 0.26862 × vertical head diameter + 0.62205 × maximum midshaft diameter − 59.6723</div>';
}
function hSummaryHTML(){
 const rows=currentHRecords().map(r=>{
   const calc=calcSpradley(r);
   return '<tr><td>'+esc(r.locus||'—')+'</td><td>'+esc(r.individual)+'</td><td>'+esc(r.number)+'</td><td>Review</td><td>'+fmt(calc.score,4)+'</td><td>Review</td></tr>';
 }).join('');
 return titleHTML('Automatically generated','Humerus · Summary','Source structure: Locus · Individual · Number · Bass · Spradley · Sex.')+
 '<div class="element-method-note warning">Bass and Spradley numeric outputs are available. Automatic sex classifications remain under verification because the original workbook does not provide consistent classification formulas.</div>'+
 '<div class="element-table-scroll"><table class="element-summary-table"><thead><tr><th>Locus</th><th>Individual</th><th>Number</th><th>Bass</th><th>Spradley score</th><th>Sex</th></tr></thead><tbody>'+ (rows||'<tr><td colspan="6">No specimens yet.</td></tr>')+'</tbody></table></div>';
}
function renderH(){
 const labels={measurements:'Measurements',bass:'Bass',spradley:'Spradley',summary:'Summary'};
 $('humerusMethodName').textContent=labels[hTab];
 $('humerusMethodLabel').textContent=hTab==='summary'?'Current view':'Selected method';
 for(const b of document.querySelectorAll('[data-humerus-tab]')){const on=b.dataset.humerusTab===hTab;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}
 const body=$('humerusMethodBody');
 if(hTab==='measurements')body.innerHTML=titleHTML('Measurements','Shared Humerus measurements','Measurements belong to one inscribed bone ID and are used across the appropriate methods.')+HUM_FIELDS.map(f=>fieldHTML(f,hState.measurements[f.code],'humerus')).join('');
 if(hTab==='bass')body.innerHTML=hBassHTML();
 if(hTab==='spradley')body.innerHTML=hSpradleyHTML();
 if(hTab==='summary')body.innerHTML=hSummaryHTML();
 $('humerusIdentityCard').hidden=hTab==='summary';
 $('humerusRecordsCard').hidden=hTab==='summary';
 renderHRows();
}
function exportHCSV(){
 const cols=HUM_FIELDS.map(f=>f.code);
 const rows=[['Locus','Individual','Number',...HUM_FIELDS.map(f=>f.name),'Spradley score','Bass status','Sex status'],...hRecords.map(r=>[r.locus,r.individual,r.number,...cols.map(c=>r.measurements[c]||''),calcSpradley(r).score??'','Review','Review'])];
 basicCSV(rows,safeFileName(bridge.getSite()+'_'+bridge.getContextName())+'_humerus.csv');
 hNotice('Humerus CSV exported.');
}

// Mandible: extend the existing separate specimen store, preserving records and IDs.
let mTab='measurements';
function selectedMandible(){return bridge.getMandibleState();}
function mResultHTML(){
 const model=selectedMandible().model||'FD1';
 const result=calcMandible(selectedMandible());
 if(result.unverified)return '<div class="element-method-note warning">FD4 has a result entered in the original spreadsheet, but its formula is absent. No calculation or sex classification is produced for FD4.</div>';
 return '<div class="element-result-grid"><div class="element-result"><span class="result-caption">Score</span><strong>'+fmt(result.score,4)+'</strong></div>'+
 '<div class="element-result"><span class="result-caption">Probability p</span><strong>'+fmt(result.probability,4)+'</strong></div>'+
 '<div class="element-result"><span class="result-caption">Sex estimation</span><strong>'+esc(result.sex||'—')+'</strong></div></div>'+
 (result.missing.length?'<p class="element-muted">Missing: '+result.missing.map(c=>esc(MAN_FIELDS.find(f=>f.code===c)?.name||c)).join(', ')+'</p>':'');
}
function mFDHTML(){
 const state=selectedMandible(),model=state.model||'FD1';
 const buttons=Object.entries(MAN_MODELS).map(([code,item])=>'<button class="element-model '+(model===code?'active':'')+'" type="button" data-model="'+code+'" aria-pressed="'+String(model===code)+'">'+code.replace('FD','FD ')+' '+(!item.calc?'· Review':'')+'</button>').join('');
 const req=MAN_MODELS[model].req;
 const table=Object.entries(MAN_MODELS).map(([code,item])=>{
  const missing=item.req.filter(c=>num(state.measurements?.[c])===null);
  const status=!item.calc?'Formula unavailable':missing.length?item.req.length-missing.length+' / '+item.req.length:'Ready';
  return '<tr><td>'+code.replace('FD','FD ')+'</td><td>'+ (item.req.length?item.req.map(c=>c.toUpperCase()).join(' · '):'Not documented')+'</td><td>'+status+'</td></tr>';
 }).join('');
 return titleHTML('Discriminant functions','Mandible · Model selection','Select a function to show only its required measurements.')+
 '<div class="element-models">'+buttons+'</div>'+
 '<div class="element-table-scroll"><table class="element-bass-table"><thead><tr><th>Function</th><th>Required source columns</th><th>Readiness</th></tr></thead><tbody>'+table+'</tbody></table></div>'+
 '<div class="element-separator"></div><div class="element-title-line"><h2>'+esc(model.replace('FD','FD '))+' · Results</h2></div>'+
 '<div id="mandibleLiveResult">'+mResultHTML()+'</div>'+
 req.map(code=>fieldHTML(MAN_FIELDS.find(f=>f.code===code),state.measurements?.[code],'mandible')).join('')+
 '<div class="element-formula">'+esc(MAN_MODELS[model].expression)+'</div>'+
 '<p class="element-muted" style="margin-top:13px">For verified functions, p = 1 / (1 + exp(−score)). The workbook examples use negative scores for Male and positive scores for Female.</p>';
}
function mSummaryHTML(){
 const records=bridge.getMandibleSaved();
 const list=records.map(r=>{
  const result=calcMandible(r);
  return '<tr><td>'+esc(r.locus||'—')+'</td><td>'+esc(r.individual)+'</td><td>'+esc(r.number)+'</td><td>'+esc(r.model||'FD1')+'</td><td>'+fmt(result.score,4)+'</td><td>'+fmt(result.probability,4)+'</td><td>'+esc(result.sex|| (result.unverified?'Review':'—'))+'</td></tr>';
 }).join('');
 return titleHTML('Automatically generated','Mandible · Summary','Calculations are based on the model selected for each saved specimen.')+
 '<div class="element-table-scroll"><table class="element-summary-table"><thead><tr><th>Locus</th><th>Individual</th><th>Number</th><th>Model</th><th>Score</th><th>p</th><th>Sex</th></tr></thead><tbody>'+ (list||'<tr><td colspan="7">No specimens yet.</td></tr>')+'</tbody></table></div>';
}
function renderM(){
 const state=selectedMandible();if(!state)return;
 if(!state.measurements||typeof state.measurements!=='object')state.measurements={};
 if(!MAN_MODELS[state.model])state.model='FD1';
 const names={measurements:'Measurements',fd:state.model.replace('FD','FD '),summary:'Summary'};
 $('mandibleMethodName').textContent=names[mTab];
 for(const b of document.querySelectorAll('[data-mandible-tab]')){const on=b.dataset.mandibleTab===mTab;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}
 const body=$('mandibleMethodBody');
 if(mTab==='measurements')body.innerHTML=titleHTML('Measurements','Shared Mandible measurements','Source columns D–L from the original Mandible worksheet. The same values are used across discriminant functions.')+MAN_FIELDS.map(f=>fieldHTML(f,state.measurements[f.code],'mandible')).join('');
 if(mTab==='fd')body.innerHTML=mFDHTML();
 if(mTab==='summary')body.innerHTML=mSummaryHTML();
 $('mandibleMethodName').textContent=names[mTab];
}
function refreshResults(){
 const hLive=$('humerusLiveResult');if(hLive)hLive.innerHTML=hSpradleyResults();
 const mLive=$('mandibleLiveResult');if(mLive)mLive.innerHTML=mResultHTML();
}

// UI bindings
for(const b of document.querySelectorAll('[data-humerus-tab]'))b.addEventListener('click',()=>{hTab=b.dataset.humerusTab;renderH();});
for(const b of document.querySelectorAll('[data-mandible-tab]'))b.addEventListener('click',()=>{mTab=b.dataset.mandibleTab;renderM();});
for(const f of ['Individual','Number','Locus'])$('humerus'+f).addEventListener('input',e=>{hState[f.toLowerCase()]=e.target.value;persistH();hNotice('Draft saved locally. Select Save specimen to add it to the table.');});
$('humerusNew').addEventListener('click',()=>{hSelected=null;hState=blankH();['Individual','Number','Locus'].forEach(n=>$('humerus'+n).value='');persistH();renderH();$('humerusIndividual').focus();hNotice('New Humerus specimen.');});
$('humerusSave').addEventListener('click',saveH);
$('humerusExport').addEventListener('click',exportHCSV);
$('humerusMethodBody').addEventListener('input',e=>{
 const code=e.target.dataset.humerusMeasure;if(!code)return;
 if(e.target.value==='')delete hState.measurements[code];else hState.measurements[code]=e.target.value;
 persistH();refreshResults();
});
$('humerusMethodBody').addEventListener('change',e=>{if(e.target.dataset.humerusMeasure)renderH();});
$('mandibleMethodBody').addEventListener('click',e=>{
 const model=e.target.closest('[data-model]')?.dataset.model;
 if(!model||!MAN_MODELS[model])return;
 selectedMandible().model=model;bridge.persistMandible();renderM();
});
$('mandibleMethodBody').addEventListener('input',e=>{
 const code=e.target.dataset.mandibleMeasure;if(!code)return;
 const state=selectedMandible();if(e.target.value==='')delete state.measurements[code];else state.measurements[code]=e.target.value;
 bridge.persistMandible();refreshResults();
});
$('mandibleMethodBody').addEventListener('change',e=>{if(e.target.dataset.mandibleMeasure)renderM();});
// Add measurement/model columns to Mandible export without altering original identity exports.
$('mandibleExport').addEventListener('click',e=>{
 if(e.defaultPrevented)return;
 // Existing identity-only export remains available from the original handler.
});

window.osteometryExtension={
 getHumerusRecords:()=>hRecords,
 persistHumerus:persistH,
 exportHumerus:()=>clone(hData),
 restoreHumerus:payload=>{
  if(payload&&typeof payload.recordsByContext==='object'&&typeof payload.draftsByContext==='object'){
   hData=clone(payload);try{localStorage.setItem(H_KEY,JSON.stringify(hData));}catch(e){}
   hContext=null;loadHContext();
  }
 },
 onElementChange:element=>{
  if(hContext!==bridge.getContextId())loadHContext();
  if(element==='humerus'){renderH();bridge.refreshContext();}
  if(element==='mandible')renderM();
 },
 renderMandible:renderM
};
loadHContext();
renderM();
})();
