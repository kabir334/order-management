const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const sample = [
  'John Doe',
  'john@example.com',
  'Acme Corporation',
  'This is a description',
  '40',
  '2500',
].join('\n');

const overlongSample = [
  'John Doe',
  'john@example.com',
  'Acme Corporation',
  'This is a description',
  '40',
  '2500',
  'ignored one',
  'ignored two',
  'ignored three',
  'ignored four',
].join('\n');

const sandbox = {
  window: {},
  document: {
    addEventListener() {},
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return {}; },
    cookie: '',
  },
  console,
  setTimeout,
  clearTimeout,
  fetch: async () => ({ ok: true, json: async () => ({ success: true }) }),
  Date,
  JSON,
  RegExp,
  Array,
  String,
  Number,
  Object,
  Boolean,
  parseInt,
  parseFloat,
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);
vm.runInContext(`const sample = ${JSON.stringify(sample)};`, sandbox, { filename: 'app.js' });
vm.runInContext(`const overlongSample = ${JSON.stringify(overlongSample)};`, sandbox, { filename: 'app.js' });

const parsed = vm.runInContext('UTILS.parseOrderMessage(sample)', sandbox, { filename: 'app.js' });
const parsedLong = vm.runInContext('UTILS.parseOrderMessage(overlongSample)', sandbox, { filename: 'app.js' });

assert.strictEqual(parsed.name, 'John Doe');
assert.strictEqual(parsed.mobile, 'john@example.com');
assert.strictEqual(parsed.address, 'Acme Corporation');
assert.strictEqual(parsed.shoeModel, 'This is a description');
assert.strictEqual(parsed.size, 40);
assert.strictEqual(parsed.price, '2500');

assert.strictEqual(parsedLong.name, 'John Doe');
assert.strictEqual(parsedLong.mobile, 'john@example.com');
assert.strictEqual(parsedLong.address, 'Acme Corporation');
assert.strictEqual(parsedLong.shoeModel, 'This is a description');
assert.strictEqual(parsedLong.size, 40);
assert.strictEqual(parsedLong.price, '2500');
assert.strictEqual(typeof parsedLong.size, 'number');

console.log('parser regression test passed');
