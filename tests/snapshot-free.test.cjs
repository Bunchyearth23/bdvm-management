const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const management = fs.readFileSync(path.join(__dirname, '..', 'Assets', 'app.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(__dirname, '..', '..', 'BDVM.Web', 'Assets', 'bootstrap.js'), 'utf8');

test('realtime notifications mark Management stale without triggering snapshots', () => {
  assert.match(management, /markStale\(\)\{this\.stale=true\}/);
  assert.match(bootstrap, /instance\.markStale\(\)/);
  assert.doesNotMatch(bootstrap, /instance\.refresh\(\{quiet:true\}\)/);
});
