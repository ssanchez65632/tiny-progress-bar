import test from 'node:test';
import assert from 'node:assert/strict';

import { ProgressBar } from '../src/index.js';

test('defaults produce a 20-cell bar at 0%', () => {
  const bar = new ProgressBar();
  assert.equal(bar.total, 100);
  assert.equal(bar.width, 20);
  assert.equal(bar.value, 0);
  assert.equal(bar.toString(), '[░░░░░░░░░░░░░░░░░░░░]   0%');
});

test('update returns a new bar and does not mutate the original', () => {
  const a = new ProgressBar({ total: 10, width: 10 });
  const b = a.update(3);
  assert.notEqual(a, b);
  assert.equal(a.value, 0);
  assert.equal(b.value, 3);
  assert.equal(a.toString(), '[░░░░░░░░░░]   0%');
  assert.equal(b.toString(), '[███░░░░░░░]  30%');
});

test('update clamps to total and to zero', () => {
  const bar = new ProgressBar({ total: 5, width: 5 });
  const over = bar.update(99);
  assert.equal(over.value, 5);
  assert.equal(over.toString(), '[█████] 100%');
  const under = over.update(-99);
  assert.equal(under.value, 0);
  assert.equal(under.toString(), '[░░░░░]   0%');
});

test('a 1-unit update on a 100-unit bar fills at least one cell', () => {
  const bar = new ProgressBar({ total: 100, width: 20 });
  const one = bar.update(1);
  assert.equal(one.value, 1);
  assert.equal(one.toString(), '[█░░░░░░░░░░░░░░░░░░░]   1%');
});

test('a 99-unit update on a 100-unit bar leaves one empty cell', () => {
  const bar = new ProgressBar({ total: 100, width: 20 });
  const almost = bar.update(99);
  assert.equal(almost.toString(), '[███████████████████░]  99%');
});

test('a zero total is treated as complete', () => {
  const bar = new ProgressBar({ total: 0, width: 8 });
  assert.equal(bar.fraction, 1);
  assert.equal(bar.percent, 100);
  assert.equal(bar.toString(), '[████████] 100%');
});

test('percent rounds to the nearest integer', () => {
  const bar = new ProgressBar({ total: 3, width: 3 });
  assert.equal(bar.update(1).percent, 33);
  assert.equal(bar.update(2).percent, 67);
  assert.equal(bar.update(3).percent, 100);
});

test('custom fill and empty characters are used', () => {
  const bar = new ProgressBar({ total: 4, width: 4, filled: '#', empty: '-' });
  assert.equal(bar.update(2).toString(), '[##--]  50%');
});

test('constructor rejects invalid total', () => {
  assert.throws(() => new ProgressBar({ total: -1 }), RangeError);
  assert.throws(() => new ProgressBar({ total: Infinity }), RangeError);
  assert.throws(() => new ProgressBar({ total: NaN }), RangeError);
});

test('constructor rejects invalid width', () => {
  assert.throws(() => new ProgressBar({ width: 0 }), RangeError);
  assert.throws(() => new ProgressBar({ width: -3 }), RangeError);
  assert.throws(() => new ProgressBar({ width: 1.5 }), RangeError);
});

test('constructor rejects invalid value', () => {
  assert.throws(() => new ProgressBar({ value: -1 }), RangeError);
  assert.throws(() => new ProgressBar({ value: NaN }), RangeError);
});

test('update rejects non-finite amounts', () => {
  const bar = new ProgressBar();
  assert.throws(() => bar.update(NaN), RangeError);
  assert.throws(() => bar.update(Infinity), RangeError);
});

test('an initial value above total is clamped', () => {
  const bar = new ProgressBar({ total: 10, width: 10, value: 50 });
  assert.equal(bar.value, 10);
  assert.equal(bar.toString(), '[██████████] 100%');
});
