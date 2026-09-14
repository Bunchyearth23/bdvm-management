const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function app(){const context={};vm.runInNewContext(fs.readFileSync(require.resolve('../Assets/app.js'),'utf8'),context);return context.BdvmManagement}
test('dossier eligibility preserves preloaded wagons away from loading tracks and excludes other operators or assigned wagons',()=>{
 const workspace={personalWagons:['a','b','c'],companyWagons:['d'],wagons:['a','b','c','d'].map(assetId=>({assetId,kind:'FreightWagon',state:'Available',lastKnownLocation:'SM-B40'})),tags:[{assetId:'a',sourceFacilityId:'SM',cargoId:'Steel',loadedCargoId:'Steel',loadedCargoAmount:1},{assetId:'b',sourceFacilityId:'SM',cargoId:'Steel',loadedCargoId:'Coal'},{assetId:'c',sourceFacilityId:'SM',cargoId:'Steel',dossierId:'busy'},{assetId:'d',sourceFacilityId:'SM',cargoId:'Steel'}]};
 const draft={originFacilityId:'SM',cargoId:'Steel',forCompany:false};
 assert.deepEqual(Array.from(app().eligibleDossierWagons(workspace,draft),w=>w.assetId),['a']);
 assert.deepEqual(Array.from(app().eligibleDossierWagons(workspace,{...draft,forCompany:true}),w=>w.assetId),['d']);
 workspace.tags[0].physicallyPresent=false;assert.equal(app().eligibleDossierWagons(workspace,draft).length,0);
});
test('checking selected independent dossiers reports partial outcomes and keeps identities separate',async()=>{
 const controller=Object.create(app().ManagementApp.prototype);controller.dossierSelection=new Set(['d1','d2','done']);controller.snapshot={industrialWorkspace:{contracts:[{contractId:'d1',state:'Active'},{contractId:'d2',state:'Active'},{contractId:'done',state:'Completed'}]}};
 const sent=[];controller.submit=async(_,payload)=>{sent.push(payload);return{state:payload.contractId==='d1'?'Succeeded':'Refused',code:'physical-check'}};controller.render=()=>{};controller.captureInteraction=()=>null;
 await controller.reconcileDossiers();assert.deepEqual(sent.map(p=>p.contractId),['d1','d2']);assert.ok(sent.every(p=>p.operation==='reconcile-delivery'));assert.equal(controller.dossierResults.length,2);assert.match(controller.dossierResults[1],/Refused/);assert.equal(controller.dossierBusy,false);
});
test('an unknown response stops a batch so retry can reconcile the same request',async()=>{
 const controller=Object.create(app().ManagementApp.prototype);controller.dossierSelection=new Set(['d1','d2']);controller.snapshot={industrialWorkspace:{contracts:[{contractId:'d1',state:'Active'},{contractId:'d2',state:'Active'}]}};
 let sent=0;controller.submit=async()=>{sent++;return undefined};controller.render=()=>{};controller.captureInteraction=()=>null;await controller.reconcileDossiers();assert.equal(sent,1);assert.match(controller.dossierResults[0],/No confirmed response/);
});
