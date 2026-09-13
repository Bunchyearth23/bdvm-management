(()=>{'use strict';
const sections=['companies','wallets','fleet','market','contracts','industry','diagnostics'];
const labels={companies:'Companies',wallets:'Wallets',fleet:'Fleet',market:'Catalog',contracts:'Contracts',industry:'Industry',passengers:'Passengers',diagnostics:'Diagnostics'};
const sectionHelp={
  companies:'Create or manage companies, membership and delegated permissions.',
  wallets:'Review personal and company balances. Every transfer names its source and destination.',
  fleet:'Your owned rolling stock. Sell equipment here when it is uncoupled, unloaded and safe.',
  market:'Choose a model and review its price. Buy for yourself or your company, then use the delivery radio in the game to place it.',
  contracts:'Combined read-only view of freight assignments, industrial contracts and passenger services.',
  industry:'Read-only warehouse directory. Expand a company to see every compatible cargo, configured inputs and outputs, and tracked stock capacity. The player chooses any movement; this screen does not reserve or plan work.',
  passengers:'Passenger workflow: configure a route, load a Passenger Jobs service in the game, reserve it with suitable rolling stock, then start and complete it.',
  diagnostics:'Read-only health information for population control, physical asset reconciliation and the dynamic economy.'
};
const emptyMessages={
  companies:'No company exists yet.',wallets:'No wallet is visible to this player.',fleet:'No rolling stock is owned by this player.',
  market:'No market offer exists yet. Offers are prepared during active gameplay once a delivery depot is available. If the stock is sold out, check again later or ask the host.',
  contracts:'No freight, industry or passenger contract is active. Start from Assignments, Industry or Passengers.',
  industry:'No loaded industrial warehouse is available yet. Load into a game world, then refresh this directory.',
  passengers:'No passenger route or service is configured yet. Create a route first, then reserve a loaded Passenger Jobs service.',
  diagnostics:'No diagnostic state was returned by the host.'
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
  ['Register lender pool','Creates the finite capital source that backs every financing offer.'],
  ['Create financing offer','Defines the full loan or credit-line terms before acceptance.']
];
const advancedPrefixes=['Configure industrial stock','Configure production recipe','Configure shortage-driven transport policy','Configure passenger route','Register lender pool','Create financing offer'];
const text=(node,value)=>{node.textContent=String(value??'')};
const publishStatus=(state,message)=>{if(typeof globalThis?.dispatchEvent==='function'&&typeof globalThis?.CustomEvent==='function')globalThis.dispatchEvent(new globalThis.CustomEvent('bdvm:status',{detail:{state,message}}))};
const uuid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const humanize=value=>String(value||'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
const displayValue=(value,key='',names=new Map())=>{if(Array.isArray(value))return value.every(item=>item==null||typeof item!=='object')?value.map(item=>names.get(String(item))||item).join(', '):JSON.stringify(value);if(value&&typeof value==='object')return JSON.stringify(value);if(typeof value==='boolean')return value?'Yes':'No';const raw=String(value??'');return /id$/i.test(key)&&names.has(raw)?`${names.get(raw)} (ID: ${raw})`:raw};
function nameLookup(snapshot){const names=new Map();for(const row of snapshot.companies||[]){if(row.companyId){names.set(row.companyId,row.name);names.set('Company:'+row.companyId,row.name)}}for(const row of snapshot.fleet||[]){if(row.assetId)names.set(row.assetId,row.displayName||humanize(row.definitionId))}for(const row of snapshot.market||[]){if(row.definitionId)names.set(row.definitionId,row.displayName||humanize(row.definitionId))}for(const row of snapshot.players||[]){if(row.playerId){names.set(row.playerId,row.displayName);names.set('Player:'+row.playerId,row.displayName)}}return names}
function table(items,filter='',emptyMessage='No data available.',names=new Map()){
  const box=document.createElement('div'),matching=(items||[]).filter(item=>JSON.stringify(item).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  if(!matching.length){box.className='bdvm-management__empty';text(box,emptyMessage);return box}
  const hidden=key=>/^(technicalDetails|version|delegatedPermissions|companyId|assetId|listingId|grantId|contractId|needId|policyId|recipeId|sessionId)$/.test(key);
  const keys=[...new Set(matching.flatMap(item=>Object.keys(item).filter(key=>item[key]!=null&&!hidden(key))))];
  keys.sort((a,b)=>(a==='recordType'||a==='subsystem'?-1:0)-(b==='recordType'||b==='subsystem'?-1:0));
  const scroller=document.createElement('div'),grid=document.createElement('table'),head=document.createElement('thead'),headRow=document.createElement('tr'),body=document.createElement('tbody');
  scroller.className='bdvm-management__table-scroll';
  for(const key of keys){const cell=document.createElement('th');cell.scope='col';text(cell,humanize(key));headRow.append(cell)}
  head.append(headRow);
  const detailsHead=document.createElement('th');text(detailsHead,'Details');headRow.append(detailsHead);
  for(const item of matching){const row=document.createElement('tr');for(const key of keys){const cell=document.createElement('td');cell.dataset.field=key;const raw=item[key];let value=raw==null?'—':displayValue(raw,key,names);if(typeof raw==='string'){value=names.get(raw)||value;if(key==='definitionId')value=names.get(raw)||humanize(raw);if(/^(leaderId|owner|account|payer)$/.test(key)&&/^(Player:)?local-/.test(raw))value='Local player';if(key==='membershipPolicy')value=humanize(raw)}text(cell,value);row.append(cell)}const cell=document.createElement('td'),details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');text(summary,'Technical details');text(pre,JSON.stringify(item,null,2));details.append(summary,pre);cell.append(details);row.append(cell);body.append(row)}
  grid.append(head,body);scroller.append(grid);box.append(scroller);return box;
}
function industryRows(items,filter){
  const box=document.createElement('div'),matching=(items||[]).filter(item=>JSON.stringify(item).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));box.className='bdvm-management__industry-list';
  if(!matching.length){box.className='bdvm-management__empty';text(box,'No industry site is configured.');return box}
  const list=(heading,values)=>{const section=document.createElement('section'),title=document.createElement('strong'),rows=document.createElement('ul');text(title,heading);for(const value of values||[]){const item=document.createElement('li');text(item,value);rows.append(item)}if(!(values||[]).length){const item=document.createElement('li');text(item,'None');rows.append(item)}section.append(title,rows);return section};
  for(const site of matching){const details=document.createElement('details'),summary=document.createElement('summary');details.dataset.interactionKey=`industry:${site.site||'Industry site'}`;text(summary,site.site||'Industry site');details.append(summary,list('Role',[site.role||'Warehouse']),list('Inputs',site.inputs),list('Outputs',site.outputs),list('Supported cargo',site.supportedCargo),list('Current stock',site.stocks));box.append(details)}return box;
}
function actionDescription(label){const match=actionHelp.find(([prefix])=>String(label||'').startsWith(prefix));return match?.[1]||''}
function isAdvanced(action){return advancedPrefixes.concat(['Create one manual','Add installed','Publish offer','Advance production','Publish need','Offer lease']).some(prefix=>String(action.label||'').startsWith(prefix))}
class ManagementApp{
  constructor(root,transport){this.root=root;this.transport=transport;this.snapshot=null;this.activeSection='companies';this.lastEnvelope=null;this.stale=false;this.status=document.createElement('p');this.status.className='bdvm-management__status';root.classList.add('bdvm-management')}
  captureInteraction(){if(typeof this.root.querySelector!=='function'||typeof this.root.querySelectorAll!=='function')return null;const values={};for(const control of this.root.querySelectorAll('[data-interaction-key]')){if(control.matches('input,select,textarea'))values[control.dataset.interactionKey]=control.type==='checkbox'?control.checked:control.value}return{filter:this.root.querySelector('input[type=search]')?.value||'',open:Array.from(this.root.querySelectorAll('details[open][data-interaction-key]')).map(node=>node.dataset.interactionKey),values}}
  restoreInteraction(state){if(!state||typeof this.root.querySelector!=='function')return;for(const key of state.open||[])this.root.querySelector(`details[data-interaction-key="${CSS.escape(key)}"]`)?.setAttribute('open','');for(const [key,value] of Object.entries(state.values||{})){const control=this.root.querySelector(`[data-interaction-key="${CSS.escape(key)}"]`);if(control){if(control.type==='checkbox')control.checked=!!value;else control.value=value}}}
  async refresh(options={}){const interaction=this.captureInteraction();if(!options.quiet)this.setStatus('Loading','Loading…');try{const next=await this.transport.snapshot(),changed=!this.snapshot||next.version!==this.snapshot.version;this.snapshot=next;this.stale=false;const needsRender=changed||typeof this.root.querySelector!=='function'||!this.root.querySelector('.bdvm-management__panel');if(needsRender)this.render(interaction);this.setStatus('Succeeded',`Live — authoritative state ${this.snapshot.correlationId??''}`)}catch(error){this.setStatus('Offline',`Offline — ${error.message}`)}}
  markStale(){this.stale=true}
  async submit(intentType,payload,options={}){if(options.confirmation&&!globalThis.confirm(options.confirmation))return;const correlationId=uuid();this.lastEnvelope={schemaVersion:1,moduleId:'BDVM.Management',intentType,correlationId,idempotencyKey:uuid(),expectedVersion:Number(this.snapshot?.version??0),payload};return this.submitEnvelope(this.lastEnvelope)}
  async retryLast(){if(!this.lastEnvelope)return;return this.submitEnvelope(this.lastEnvelope)}
  async submitEnvelope(envelope){this.setStatus('Pending',`Pending — ${envelope.correlationId}`);try{const result=await this.transport.intent(envelope),state=result.state||'Reconcile',message=`${state} — ${result.code||''} — ${result.correlationId||envelope.correlationId}`;if(['Succeeded','Conflict','Reconcile','Refused'].includes(state)){await this.refresh();this.setStatus(state,message)}else this.setStatus(state,message);return result}catch(error){const state=error.name==='AbortError'?'Timeout':'Refused',reason=String(error?.message||'The host did not return a usable response.');this.setStatus(state,`${state} — ${reason} — retry keeps request ${envelope.correlationId}`)}}
  setStatus(state,message){this.status.dataset.state=state;text(this.status,message);publishStatus(state,message)}
  actionCard(action){
    const card=document.createElement('div'),title=document.createElement('strong'),controls=new Map();
    card.className='bdvm-management__action';card.dataset.interactionKey=`action:${action.label}`;text(title,action.label);title.setAttribute('role','button');title.setAttribute('tabindex','0');title.setAttribute('aria-expanded','false');const toggle=()=>{const open=card.classList.toggle('open');title.setAttribute('aria-expanded',String(open))};title.onclick=toggle;title.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle()}};card.append(title);
    const description=action.description||actionDescription(action.label);
    if(description){const help=document.createElement('p');help.className='bdvm-management__action-help';text(help,description);card.append(help)}
    let unavailable=false;
    for(const field of action.fields||[]){
      const label=document.createElement('label'),caption=document.createElement('span');
      text(caption,field.label||humanize(field.name));
      const multi=field.kind==='multiselect',select=field.kind==='select';
      const control=document.createElement(multi?'div':select?'select':'input');
      if(multi){
        control.className='bdvm-management__choices';
        for(const value of field.options||[]){
          const item=document.createElement('label'),check=document.createElement('input'),name=document.createElement('span');
          check.type='checkbox';check.value=value;check.checked=String(field.value||'').split(',').includes(value);
          text(name,field.optionLabels?.[value]||humanize(value));item.append(check,name);control.append(item);
        }
      }else if(select){
        for(const value of field.options||[]){const option=document.createElement('option');option.value=value;text(option,field.optionLabels?.[value]||humanize(value));control.append(option)}
        control.value=field.value||field.options?.[0]||'';
      }else if(field.kind==='checkbox'){control.type='checkbox';control.checked=String(field.value).toLowerCase()==='true'}
      else{control.type=field.kind==='number'?'number':'text';control.value=field.value||'';if(field.kind==='number')control.step='any'}
      if((multi||select)&&!(field.options||[]).length){const reason=document.createElement('span');text(reason,'No eligible option is currently available.');label.append(reason);unavailable=true}
      control.dataset.kind=field.kind||'text';control.dataset.required=field.required?'true':'false';control.dataset.interactionKey=`field:${action.label}:${field.name}`;
      label.append(caption,control);card.append(label);controls.set(field.name,control);
    }
    const button=document.createElement('button');button.type='button';button.disabled=unavailable;text(button,action.label);card.append(button);
    button.onclick=()=>{
      if(button.disabled)return;
      const payload={...(action.payload||{})};
      for(const [name,control] of controls){
        const kind=control.dataset.kind;
        const value=kind==='checkbox'?!!control.checked:kind==='multiselect'?Array.from(control.children).filter(item=>item.children[0].checked).map(item=>item.children[0].value):String(control.value??'').trim();
        if(control.dataset.required==='true'&&(value===''||value==null||(Array.isArray(value)&&value.length===0))){
          this.setStatus('Refused',`Choose ${((action.fields||[]).find(field=>field.name===name)?.label||humanize(name)).toLowerCase()} before continuing.`);return;
        }
        payload[name]=kind==='number'?(value===''?null:Number(value)):kind==='csv'?String(value).split(',').map(x=>x.trim()).filter(Boolean):value;
      }
      this.submit(action.intentType,payload,{confirmation:action.confirmation||''});
    };return card;
  }
  renderActions(panel,area){const actions=(this.snapshot?.actions||[]).filter(x=>x.area===area);if(!actions.length)return;const heading=document.createElement('h3');text(heading,'What you can do');panel.append(heading);const advanced=actions.filter(isAdvanced),primary=actions.filter(action=>!isAdvanced(action));for(const action of primary)panel.append(this.actionCard(action));if(advanced.length){const group=document.createElement('details'),summary=document.createElement('summary');group.className='bdvm-management__advanced';group.dataset.interactionKey=`advanced:${area}`;text(summary,'Advanced host setup');group.append(summary);for(const action of advanced)group.append(this.actionCard(action));panel.append(group)}}
  render(interaction){this.root.querySelectorAll(':scope > :not(.bdvm-management__status)').forEach(x=>x.remove());const tabs=document.createElement('div');tabs.className='bdvm-management__tabs';const panel=document.createElement('section');panel.className='bdvm-management__panel';const names=nameLookup(this.snapshot);for(const key of sections){const button=document.createElement('button');button.type='button';text(button,labels[key]);button.onclick=()=>{this.activeSection=key;panel.replaceChildren();const title=document.createElement('h2'),help=document.createElement('p'),filter=document.createElement('input'),results=document.createElement('div'),items=this.snapshot?.[key]||[];text(title,labels[key]);help.className='bdvm-management__help';text(help,sectionHelp[key]||'');filter.type='search';filter.placeholder=`Filter ${labels[key].toLocaleLowerCase()}`;filter.value=interaction?.filter||'';const enabled=this.snapshot?.featureFlags?.[key]!==false;const draw=()=>results.replaceChildren(enabled?(key==='industry'?industryRows(items,filter.value||''):table(items,filter.value||'',emptyMessages[key]||'No data available.',names)):document.createTextNode('This capability is disabled on the host.'));filter.oninput=draw;draw();panel.append(title,help);if(items.length)panel.append(filter);panel.append(results);if(enabled)this.renderActions(panel,key);this.restoreInteraction(interaction)};tabs.append(button)}const refresh=document.createElement('button');refresh.type='button';text(refresh,'Refresh data');refresh.onclick=()=>this.refresh();tabs.append(refresh);const retry=document.createElement('button');retry.type='button';text(retry,'Retry / reconcile');retry.onclick=()=>this.retryLast();tabs.append(retry);const logs=document.createElement('button');logs.type='button';text(logs,'Export diagnostics');logs.onclick=()=>this.transport.exportLogs();tabs.append(logs);this.root.append(tabs,panel);tabs.children[sections.indexOf(this.activeSection)]?.click()}
}
globalThis.BdvmManagement=Object.freeze({ManagementApp,create(root,transport){return new ManagementApp(root,transport)}})
})();
