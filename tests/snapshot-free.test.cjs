const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const management = fs.readFileSync(path.join(__dirname, '..', 'Assets', 'app.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(__dirname, '..', '..', 'BDVM.Web', 'Assets', 'bootstrap.js'), 'utf8');

test('realtime notifications mark Management stale without triggering snapshots', () => {
  const context = {};
  require('node:vm').runInNewContext(management, context);
  const app = Object.create(context.BdvmManagement.ManagementApp.prototype);
  let requests = 0, reported = '';
  app.refresh = () => { requests++; };
  app.setStatus = state => { reported = state; };
  app.markStale();
  assert.equal(app.stale, true);
  assert.equal(reported, 'Stale');
  assert.equal(requests, 0);
  assert.match(bootstrap, /instance\.markStale\(\)/);
  assert.doesNotMatch(bootstrap, /instance\.refresh\(\{quiet:true\}\)/);
});
