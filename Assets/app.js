(()=>{'use strict';
const sections=['companies','wallets','fleet','market','deliveries','leases','contracts','industry','passengers','maintenance','financing','assignments','yardPlans','diagnostics'];
const labels={companies:'Companies',wallets:'Wallets',fleet:'Fleet',market:'Catalog',deliveries:'Deliveries',leases:'Leases',contracts:'Contracts',industry:'Industry',passengers:'Passengers',maintenance:'Maintenance',financing:'Financing',assignments:'Assignments',yardPlans:'Yard plans',diagnostics:'Diagnostics'};
const sectionHelp={
  companies:'Create or manage companies, membership and delegated permissions.',
  wallets:'Review personal and company balances. Every transfer names its source and destination.',
  fleet:'Your owned or leased rolling stock. The reported track is read live when the exact vehicle is loaded.',
  market:'Buy rolling stock from finite offers. Host setup: add an installed model with an explicit price and stock, then publish an offer.',
  deliveries:'Rolling stock you own but have not placed yet. Delivery is free once and is restricted to an approved depot or service track.',
  leases:'Rolling-stock lease offers and active leases. A catalog offer must exist before the host can offer that model for lease.',
  contracts:'Combined read-only view of freight assignments, industrial contracts and passenger services.',
  industry:'Industry workflow: discover a pilot chain, produce cargo, publish a transport need, accept it, assign compatible wagons, then run and deliver the job.',
  passengers:'Passenger workflow: configure a route, load a Passenger Jobs service in the game, reserve it with suitable rolling stock, then start and complete it.',
  maintenance:'Track manual servicing costs. Choose a vehicle and maximum budget, perform the work in the game, then complete or cancel the open session.',
  financing:'Optional company financing backed by a finite lender pool. Register capital, create disclosed terms, then accept, draw or repay.',
  assignments:'Connect a loaded in-game freight job to owned or leased rolling stock so BDVM can authorize operation and settle revenue.',
  yardPlans:'Planning aid for an active assignment. It stores an ordered track sequence but never drives trains or changes switches.',
  diagnostics:'Read-only health information for population control, physical asset reconciliation and the dynamic economy.'
};
const emptyMessages={
  companies:'No company exists yet.',wallets:'No wallet is visible to this player.',fleet:'No rolling stock is owned or leased by this player.',
  market:'No market offer exists yet. The local host can configure an installed model and finite stock below.',deliveries:'No rolling-stock delivery is pending.',
  leases:'No lease is currently offered or active. Publish a catalog offer first, then create a lease from it.',
  contracts:'No freight, industry or passenger contract is active. Start from Assignments, Industry or Passengers.',
  industry:'No industrial chain is configured yet. Use the pilot-chain action when available; manual setup is under Advanced host setup.',
  passengers:'No passenger route or service is configured yet. Create a route first, then reserve a loaded Passenger Jobs service.',
  maintenance:'No maintenance session is open. Select a vehicle below to authorize and track manual service work.',
  financing:'No lender pool or financing contract exists. This optional system remains inactive until the host configures it.',
  assignments:'No BDVM freight assignment exists. Load a freight job in the game, then reserve it below with your rolling stock.',
  yardPlans:'No yard plan exists. Create one only after an assignment is active.',diagnostics:'No diagnostic state was returned by the host.'
};
const actionHelp=[
  ['Observe maintenance','This opens a cost-tracking session; it does not repair or refuel the vehicle automatically.'],
  ['Reserve an existing freight job','Select a currently loaded freight job and the exact rolling stock that will operate it.'],
  ['Create planning-only yard sequence','Enter track IDs in working order. This is a checklist only and cannot move equipment.'],
  ['Configure passenger route','Host setup for demand, frequency, fare and lateness rules.'],
  ['Reserve passenger service','Links one loaded Passenger Jobs service to a configured route and selected rolling stock.'],
  ['Configure industrial stock','Advanced host setup for how much cargo a facility currently holds and can store.'],
  ['Configure production recipe','Advanced host setup for cargo consumed, cargo produced and production cadence.'],
  ['Configure shortage-driven transport policy','Advanced host setup that turns destination shortages into finite transport needs.'],
  ['Create transport contract','Manual advanced contract creation; the pilot workflow normally creates needs from policy instead.'],
  ['Register lender pool','Creates the finite capital source that backs every financing offer.'],
  ['Create financing offer','Defines the full loan or credit-line terms before acceptance.']
];
const advancedPrefixes=['Configure industrial stock','Configure production recipe','Configure shortage-driven transport policy','Create transport contract','Configure passenger route','Register lender pool','Create financing offer'];
const text=(node,value)=>{node.textContent=String(value??'')};
const uuid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const humanize=value=>String(value||'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
const displayValue=(value,key='',names=new Map())=>{if(Array.isArray(value))return value.every(item=>item==null||typeof item!=='object')?value.map(item=>names.get(String(item))||item).join(', '):JSON.stringify(value);if(value&&typeof value==='object')return JSON.stringify(value);if(typeof value==='boolean')return value?'Yes':'No';const raw=String(value??'');return /id$/i.test(key)&&names.has(raw)?`${names.get(raw)} (ID: ${raw})`:raw};
function nameLookup(snapshot){const names=new Map(),visit=value=>{if(Array.isArray(value)){value.forEach(visit);return}if(!value||typeof value!=='object')return;const label=value.displayName||value.routeName||value.serviceName||value.locationName||value.name;for(const [key,item] of Object.entries(value)){if(label&&/id$/i.test(key)&&typeof item==='string')names.set(item,String(label));visit(item)}};visit(snapshot);return names}
function table(items,filter='',emptyMessage='No data available.',names=new Map()){
  const box=document.createElement('div'),matching=(items||[]).filter(item=>JSON.stringify(item).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  if(!matching.length){box.className='bdvm-management__empty';text(box,emptyMessage);return box}
  const keys=[...new Set(matching.flatMap(item=>Object.keys(item).filter(key=>item[key]!=null)))];
  keys.sort((a,b)=>(a==='recordType'||a==='subsystem'?-1:0)-(b==='recordType'||b==='subsystem'?-1:0));
  const scroller=document.createElement('div'),grid=document.createElement('table'),head=document.createElement('thead'),headRow=document.createElement('tr'),body=document.createElement('tbody');
  scroller.className='bdvm-management__table-scroll';
  for(const key of keys){const cell=document.createElement('th');cell.scope='col';text(cell,humanize(key));headRow.append(cell)}
  head.append(headRow);
  for(const item of matching){const row=document.createElement('tr');for(const key of keys){const cell=document.createElement('td');cell.dataset.field=key;text(cell,item[key]==null?'—':displayValue(item[key],key,names));row.append(cell)}body.append(row)}
  grid.append(head,body);scroller.append(grid);box.append(scroller);return box;
}
function actionDescription(label){const match=actionHelp.find(([prefix])=>String(label||'').startsWith(prefix));return match?.[1]||''}
function isAdvanced(action){return advancedPrefixes.some(prefix=>String(action.label||'').startsWith(prefix))}
class ManagementApp{
  constructor(root,transport){this.root=root;this.transport=transport;this.snapshot=null;this.lastEnvelope=null;this.status=document.createElement('p');this.status.className='bdvm-management__status';root.classList.add('bdvm-management');root.append(this.status)}
  async refresh(){this.setStatus('Loading','Loading…');try{this.snapshot=await this.transport.snapshot();this.render();this.setStatus('Succeeded',`Reconciled — authoritative state v${this.snapshot.version??'?'} — ${this.snapshot.correlationId??''}`)}catch(error){this.setStatus('Offline',`Offline — ${error.message}`)}}
  async submit(intentType,payload,options={}){if(options.confirmation&&!globalThis.confirm(options.confirmation))return;const correlationId=uuid();this.lastEnvelope={schemaVersion:1,moduleId:'BDVM.Management',intentType,correlationId,idempotencyKey:uuid(),expectedVersion:Number(this.snapshot?.version??0),payload};return this.submitEnvelope(this.lastEnvelope)}
  async retryLast(){if(!this.lastEnvelope)return;return this.submitEnvelope(this.lastEnvelope)}
  async submitEnvelope(envelope){this.setStatus('Pending',`Pending — ${envelope.correlationId}`);try{const result=await this.transport.intent(envelope),state=result.state||'Reconcile',message=`${state} — ${result.code||''} — ${result.correlationId||envelope.correlationId}`;if(['Succeeded','Conflict','Reconcile','Refused'].includes(state)){await this.refresh();this.setStatus(state,message)}else this.setStatus(state,message);return result}catch(error){const state=error.name==='AbortError'?'Timeout':'Refused',reason=String(error?.message||'The host did not return a usable response.');this.setStatus(state,`${state} — ${reason} — retry keeps request ${envelope.correlationId}`)}}
  setStatus(state,message){this.status.dataset.state=state;text(this.status,message)}
  actionCard(action){const card=document.createElement('div'),title=document.createElement('strong'),controls=new Map();card.className='bdvm-management__action';text(title,action.label);card.append(title);const description=action.description||actionDescription(action.label);if(description){const help=document.createElement('p');help.className='bdvm-management__action-help';text(help,description);card.append(help)}for(const field of (action.fields||[])){const label=document.createElement('label'),caption=document.createElement('span'),isSelect=field.kind==='select'||field.kind==='multiselect',control=isSelect?document.createElement('select'):document.createElement('input');text(caption,field.label||humanize(field.name));if(isSelect){control.multiple=field.kind==='multiselect';for(const value of (field.options||[])){const option=document.createElement('option');option.value=value;text(option,field.optionLabels?.[value]||value);control.append(option)}if(!control.multiple)control.value=field.value||field.options?.[0]||''}else if(field.kind==='checkbox'){control.type='checkbox';control.checked=String(field.value).toLowerCase()==='true'}else{control.type=field.kind==='number'?'number':'text';control.value=field.value||''}control.dataset.kind=field.kind||'text';control.dataset.required=field.required?'true':'false';label.append(caption,control);card.append(label);controls.set(field.name,control)}const button=document.createElement('button');button.type='button';text(button,action.label);card.append(button);button.onclick=()=>{const payload={...(action.payload||{})};for(const [name,control] of controls){const kind=control.dataset.kind,value=kind==='checkbox'?!!control.checked:kind==='multiselect'?Array.from(control.selectedOptions||[]).map(option=>option.value):String(control.value??'').trim();if(control.dataset.required==='true'&&(value===''||value==null||(Array.isArray(value)&&value.length===0))){this.setStatus('Refused',`Required field missing — ${humanize(name)}`);return}payload[name]=kind==='number'?(value===''?null:Number(value)):kind==='csv'?String(value).split(',').map(x=>x.trim()).filter(Boolean):value}this.submit(action.intentType,payload,{confirmation:action.confirmation||''})};return card}
  renderActions(panel,area){const actions=(this.snapshot?.actions||[]).filter(x=>x.area===area);if(!actions.length)return;const heading=document.createElement('h3');text(heading,'What you can do');panel.append(heading);const advanced=actions.filter(isAdvanced),primary=actions.filter(action=>!isAdvanced(action));for(const action of primary)panel.append(this.actionCard(action));if(advanced.length){const group=document.createElement('details'),summary=document.createElement('summary');group.className='bdvm-management__advanced';text(summary,'Advanced host setup');group.append(summary);for(const action of advanced)group.append(this.actionCard(action));panel.append(group)}}
  render(){this.root.querySelectorAll(':scope > :not(.bdvm-management__status)').forEach(x=>x.remove());const tabs=document.createElement('div');tabs.className='bdvm-management__tabs';const panel=document.createElement('section');panel.className='bdvm-management__panel';const names=nameLookup(this.snapshot);for(const key of sections){const button=document.createElement('button');button.type='button';text(button,labels[key]);button.onclick=()=>{panel.replaceChildren();const title=document.createElement('h2'),help=document.createElement('p'),filter=document.createElement('input'),results=document.createElement('div'),items=this.snapshot?.[key]||[];text(title,labels[key]);help.className='bdvm-management__help';text(help,sectionHelp[key]||'');filter.type='search';filter.placeholder=`Filter ${labels[key].toLocaleLowerCase()}`;const enabled=this.snapshot?.featureFlags?.[key]!==false;const draw=()=>results.replaceChildren(enabled?table(items,filter.value||'',emptyMessages[key]||'No data available.',names):document.createTextNode('This capability is disabled on the host.'));filter.oninput=draw;draw();panel.append(title,help);if(items.length)panel.append(filter);panel.append(results);if(enabled)this.renderActions(panel,key)};tabs.append(button)}const retry=document.createElement('button');retry.type='button';text(retry,'Retry / reconcile');retry.onclick=()=>this.retryLast();tabs.append(retry);const logs=document.createElement('button');logs.type='button';text(logs,'Export diagnostics');logs.onclick=()=>this.transport.exportLogs();tabs.append(logs);this.root.append(tabs,panel);tabs.firstElementChild?.click()}
}
globalThis.BdvmManagement=Object.freeze({ManagementApp,create(root,transport){return new ManagementApp(root,transport)}})
})();
