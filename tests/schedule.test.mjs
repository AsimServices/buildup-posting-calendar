import test from 'node:test';
import assert from 'node:assert/strict';
import {dates,defaults,START,END,getToday,earliestPending,canAnswer,stats,readSaved} from '../app/schedule.ts';

test('90 inclusive days, exactly 55 publishing days and 35 rest days',()=>{
  assert.equal(dates.length,90);assert.equal(dates[0],START);assert.equal(dates.at(-1),END);
  assert.equal(stats(defaults,{}).total,55);assert.equal(dates.filter(d=>!defaults[d]).length,35);
});
test('future days and rest days cannot be answered',()=>{
  assert.equal(canAnswer('2026-10-07',defaults,{},START),false);
  assert.equal(canAnswer('2026-10-08',defaults,{},'2026-10-09'),false);
  assert.equal(canAnswer(START,defaults,{},'2026-10-05'),false);
});
test('earliest unanswered post gates later posts, skipping rest days',()=>{
  assert.equal(earliestPending(defaults,{},'2026-10-09'),START);
  assert.equal(canAnswer('2026-10-09',defaults,{},'2026-10-09'),false);
  const answers={[START]:'missed','2026-10-07':'completed'};
  assert.equal(earliestPending(defaults,answers,'2026-10-09'),'2026-10-09');
  assert.equal(canAnswer('2026-10-09',defaults,answers,'2026-10-09'),true);
  assert.equal(stats(defaults,answers).score,0);
});
test('expired dates do not auto-mark as missed; corrections replace score',()=>{
  assert.equal(stats(defaults,{}).missed,0);
  const answers={[START]:'missed'};
  assert.equal(canAnswer(START,defaults,answers,'2026-10-20'),true);
  assert.equal(stats(defaults,answers).score,-1);
  answers[START]='completed';assert.equal(stats(defaults,answers).score,1);
});
test('timezone rolls over at Karachi midnight across year boundary',()=>{
  assert.equal(getToday(new Date('2026-10-06T18:59:59Z')),'2026-10-06');
  assert.equal(getToday(new Date('2026-10-06T19:00:00Z')),'2026-10-07');
  assert.equal(getToday(new Date('2026-12-31T19:00:00Z')),'2027-01-01');
});
test('storage roundtrip validates shape and protects corrupt history',()=>{
  const data={version:1,plan:defaults,answers:{[START]:'completed'}};
  assert.deepEqual(readSaved(JSON.stringify(data)),{plan:defaults,answers:data.answers});
  assert.throws(()=>readSaved('{broken'));assert.throws(()=>readSaved(JSON.stringify({...data,version:99})));
  assert.throws(()=>readSaved(JSON.stringify({...data,answers:{'2026-10-08':'completed'}})));
  assert.throws(()=>readSaved(JSON.stringify({...data,plan:{}})));
});
