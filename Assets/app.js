(()=>{'use strict';
const sections=['companies','wallets','fleet','market','leases','contracts','industry','passengers','maintenance','financing','assignments','yardPlans','diagnostics'];
const labels={companies:'Companies',wallets:'Wallets',fleet:'Fleet',market:'Catalog',leases:'Leases',contracts:'Contracts',industry:'Industry',passengers:'Passengers',maintenance:'Maintenance',financing:'Financing',assignments:'Assignments',yardPlans:'Yard plans',diagnostics:'Diagnostics'};
const text=(node,value)=>{node.textContent=String(value??'')};
const uuid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
function table(items,filter=''){
  const box=document.createElement('div'),matching=(items||[]).filter(item=>JSON.stringify(item).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  if(!matching.length){text(box,'No data available.');return box}
  const grid=document.createElement('table'),body=document.createElement('tbody');
  for(const item of matching){const row=document.createElement('tr');for(const [key,value] of Object.entries(item)){if(value!=null){const cell=document.createElement('td');cell.dataset.field=key;text(cell,typeof value==='object'?JSON.stringify(value):value);row.append(cell)}}body.append(row)}
  grid.append(body);box.append(grid);return box;
}
class ManagementApp{
  constructor(root,transport){this.root=root;this.transport=transport;this.snapshot=null;this.lastEnvelope=null;this.status=document.createElement('p');this.status.className='bdvm-management__status';root.classList.add('bdvm-management');root.append(this.status)}
  async refresh(){this.setStatus('Loading','Loading…');try{this.snapshot=await this.transport.snapshot();this.render();this.setStatus('Succeeded',`Reconciled — authoritative state v${this.snapshot.version??'?'} — ${this.snapshot.correlationId??''}`)}catch(error){this.setStatus('Offline',`Offline — ${error.message}`)}}
  async submit(intentType,payload,options={}){if(options.confirmation&&!globalThis.confirm(options.confirmation))return;const correlationId=uuid();this.lastEnvelope={schemaVersion:1,moduleId:'BDVM.Management',intentType,correlationId,idempotencyKey:uuid(),expectedVersion:Number(this.snapshot?.version??0),payload};return this.submitEnvelope(this.lastEnvelope)}
  async retryLast(){if(!this.lastEnvelope)return;return this.submitEnvelope(this.lastEnvelope)}
  async submitEnvelope(envelope){this.setStatus('Pending',`Pending — ${envelope.correlationId}`);try{const result=await this.transport.intent(envelope),state=result.state||'Reconcile',message=`${state} — ${result.code||''} — ${result.correlationId||envelope.correlationId}`;if(['Succeeded','Conflict','Reconcile','Refused'].includes(state)){await this.refresh();this.setStatus(state,message)}else this.setStatus(state,message);return result}catch(error){this.setStatus(error.name==='AbortError'?'Timeout':'Offline',`${error.name==='AbortError'?'Timeout':'Offline'} — outcome unknown; retry uses the same idempotency key — ${envelope.correlationId}`)}}
  setStatus(state,message){this.status.dataset.state=state;text(this.status,message)}
  renderActions(panel,area){for(const action of (this.snapshot?.actions||[]).filter(x=>x.area===area)){const button=document.createElement('button');button.type='button';text(button,action.label);button.onclick=()=>this.submit(action.intentType,action.payload||{}, {confirmation:action.confirmation||''});panel.append(button)}}
  render(){this.root.querySelectorAll(':scope > :not(.bdvm-management__status)').forEach(x=>x.remove());const tabs=document.createElement('div');tabs.className='bdvm-management__tabs';const panel=document.createElement('section');panel.className='bdvm-management__panel';
    for(const key of sections){const button=document.createElement('button');button.type='button';text(button,labels[key]);button.onclick=()=>{panel.replaceChildren();const title=document.createElement('h2'),filter=document.createElement('input'),results=document.createElement('div');text(title,labels[key]);filter.type='search';filter.placeholder='Filter';const enabled=this.snapshot?.featureFlags?.[key]!==false;const draw=()=>results.replaceChildren(enabled?table(this.snapshot?.[key]||[],filter.value||''):document.createTextNode('This capability is unavailable on the host.'));filter.oninput=draw;draw();panel.append(title,filter,results);if(enabled)this.renderActions(panel,key)};tabs.append(button)}
    const retry=document.createElement('button');retry.type='button';text(retry,'Retry / reconcile');retry.onclick=()=>this.retryLast();tabs.append(retry);const logs=document.createElement('button');logs.type='button';text(logs,'Export diagnostics');logs.onclick=()=>this.transport.exportLogs();tabs.append(logs);this.root.append(tabs,panel);tabs.firstElementChild?.click()}
}
globalThis.BdvmManagement=Object.freeze({ManagementApp,create(root,transport){return new ManagementApp(root,transport)}})
})();
