/* Generic skeletal-element record workspace.
 * Each anatomical element has independent records within a Site / Context.
 * No osteometric formulas are inferred for elements without validated protocols.
 */
(function () {
  'use strict';
  const bridge = window.osteometryBridge;
  if (!bridge) return;
  const $ = id => document.getElementById(id);
  const KEY = 'osteometry_other_elements_v1';
  const definitions = Object.freeze({
    cranium:'Cranium', clavicle:'Clavicle', radius:'Radius', ulna:'Ulna',
    pelvis:'Pelvis', patella:'Patella', tibia:'Tibia',
    fibula:'Fibula', calcaneus:'Calcaneus'
  });
  const names = Object.keys(definitions);
  const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const ident = value => clean(value).toLocaleLowerCase();
  const uid = () => 'bone_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9);
  const blank = () => ({individual:'',number:'',locus:'',side:''});
  const normal = value => ({
    individual:clean(value?.individual),number:clean(value?.number),
    locus:clean(value?.locus),side:['Left','Right','Unknown',''].includes(value?.side)?value.side:''
  });
  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (parsed && parsed.version===1 && typeof parsed.recordsByContext==='object' && typeof parsed.draftsByContext==='object')
        return parsed;
    } catch (_error) {}
    return {version:1,recordsByContext:{},draftsByContext:{}};
  }
  let store=read();
  let element=null, context=null, records=[], state=blank(), selected=null;

  function ensureContexts() {
    const id=bridge.getContextId();
    if(!store.recordsByContext[id] || typeof store.recordsByContext[id]!=='object') store.recordsByContext[id]={};
    if(!store.draftsByContext[id] || typeof store.draftsByContext[id]!=='object') store.draftsByContext[id]={};
    return id;
  }
  function persist() {
    if(!element) return true;
    const ctx=ensureContexts();
    store.recordsByContext[ctx][element]=clone(records);
    store.draftsByContext[ctx][element]=clone(state);
    try { localStorage.setItem(KEY,JSON.stringify(store));return true; }
    catch (_error) { note('Browser storage unavailable. Export records before closing.');return false; }
  }
  function load(name) {
    element=name;
    context=ensureContexts();
    records=(Array.isArray(store.recordsByContext[context][element])?
      store.recordsByContext[context][element]:[]).map(x=>({...normal(x),id:clean(x.id)||uid()}));
    state=normal(store.draftsByContext[context][element]);
    selected=null;
    const existing=records.find(x=>ident(x.number)===ident(state.number)&&ident(state.number));
    if(existing){selected=existing.id;state=normal(existing);}
    fillForm();
  }
  function fillForm() {
    for(const field of ['Individual','Number','Locus','Side'])
      $('other'+field).value=state[field.toLowerCase()];
  }
  function note(message){$('otherStatus').textContent=message;}
  function csvCell(v){
    let text=String(v??'');
    if(/^\s*[=+\-@]/.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function filename(suffix) {
    return (bridge.getSite()+'_'+bridge.getContextName()+'_'+suffix).replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'')+'.csv';
  }
  function render() {
    if(!element)return;
    const name=definitions[element];
    $('otherHeading').textContent=name;
    $('otherBreadcrumb').textContent=name;
    $('otherIdentityHeading').textContent=name+' · Identity';
    $('otherRecordsHeading').textContent=name+' specimens';
    $('otherCount').textContent='('+records.length+')';
    $('otherEmpty').hidden=records.length>0;
    $('otherExport').disabled=records.length===0;
    const tbody=$('otherRows');tbody.replaceChildren();
    for(const record of records){
      const tr=document.createElement('tr');
      if(record.id===selected)tr.classList.add('selected');
      tr.innerHTML='<td>'+esc(record.individual||'—')+'</td><td>'+esc(record.number)+'</td><td>'+esc(record.locus||'—')+'</td><td>'+esc(record.side||'—')+'</td><td></td>';
      const actions=document.createElement('div');actions.className='mandible-table-actions';
      const open=document.createElement('button');open.type='button';open.className='button mini';open.textContent='Open';
      open.addEventListener('click',()=>{
        selected=record.id;state=normal(record);fillForm();persist();render();note('Specimen opened.');
      });
      const del=document.createElement('button');del.type='button';del.className='button mini tertiary';del.textContent='Delete';
      del.addEventListener('click',()=>{
        if(!confirm('Delete '+name+' specimen '+record.number+'?'))return;
        records=records.filter(x=>x.id!==record.id);
        if(selected===record.id){selected=null;state=blank();fillForm();}
        persist();render();bridge.refreshContext();note('Specimen deleted.');
      });
      actions.append(open,del);tr.lastElementChild.append(actions);tbody.append(tr);
    }
  }
  function show(name) {
    if(!definitions[name]) { $('otherElementView').hidden=true;return; }
    $('otherElementView').hidden=false;
    if(element!==name||context!==bridge.getContextId())load(name);
    render();
    bridge.refreshContext();
    document.title='Osteometric Analysis | '+bridge.getSite()+' / '+bridge.getContextName()+' | '+definitions[name];
  }
  function save() {
    if(!clean(state.number)){note('Enter the inscribed bone number to save.');return;}
    const conflict=records.find(x=>ident(x.number)===ident(state.number)&&x.id!==selected);
    if(conflict){note('This bone number is already in the '+definitions[element]+' records. Open the existing specimen to edit.');return;}
    if(!selected)selected=uid();
    const item={...normal(state),id:selected};
    const position=records.findIndex(x=>x.id===selected);
    if(position===-1)records.push(item);else records[position]=item;
    const ok=persist();render();bridge.refreshContext();note(ok?'Specimen saved locally.':'Browser storage unavailable. Export your data.');
  }

  for(const field of ['Individual','Number','Locus','Side'])
    $('other'+field).addEventListener(field==='Side'?'change':'input',event=>{
      if(!element)return;
      state[field.toLowerCase()]=event.target.value;
      persist();note('Draft saved in this browser. Select Save specimen to add it to the table.');
    });
  $('otherNew').addEventListener('click',()=>{
    selected=null;state=blank();fillForm();persist();render();note('New specimen.');
    $('otherNumber').focus();
  });
  $('otherSave').addEventListener('click',save);
  $('otherExport').addEventListener('click',()=>{
    if(!records.length)return;
    const rows=[['Individual','Number','Locus','Side'],...records.map(x=>[x.individual,x.number,x.locus,x.side])];
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=filename(element);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2000);
    note('Specimen records exported as CSV.');
  });
  window.osteometryGeneral={
    show,
    has:name=>Boolean(definitions[name]),
    getRecords:name=>{
      const ctx=bridge.getContextId();
      if(element===name&&context===ctx)return records;
      return store.recordsByContext?.[ctx]?.[name]||[];
    },
    exportData:()=>clone(store),
    restoreData:payload=>{
      if(!payload||payload.version!==1||!payload.recordsByContext||!payload.draftsByContext)return false;
      store=clone(payload);element=null;context=null;records=[];state=blank();selected=null;
      try{localStorage.setItem(KEY,JSON.stringify(store));}catch(_error){}
      return true;
    }
  };
})();