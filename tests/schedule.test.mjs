import test from 'node:test';
import assert from 'node:assert/strict';
import {dates,defaults,START,END,MOVED_REEL_DATE,buildDates,buildDefaults,endDate,movedReelDate,getToday,earliestPending,canAnswer,stats,readSaved} from '../app/schedule.ts';

test('90 inclusive days, 55 publishing chances, and setup day',()=>{
  assert.equal(dates.length,90);assert.equal(dates[0],START);assert.equal(dates.at(-1),END);
  assert.equal(stats(defaults,{}).total,55);assert.equal(dates.filter(d=>!defaults[d]).length,35);
  assert.equal(defaults[START],null);assert.equal(defaults[MOVED_REEL_DATE],'reel');
});
test('setup, future days, and rest days cannot be answered',()=>{
  assert.equal(canAnswer('2026-10-07',defaults,{},START),false);
  assert.equal(canAnswer('2026-10-10',defaults,{},'2026-10-10'),false);
  assert.equal(canAnswer(START,defaults,{},'2026-10-05'),false);
  assert.equal(canAnswer(START,defaults,{},START),false);
});
test('first publishing day gates later posts',()=>{
  assert.equal(earliestPending(defaults,{},'2026-10-09'),'2026-10-07');
  assert.equal(canAnswer('2026-10-09',defaults,{},'2026-10-09'),false);
  const answers={'2026-10-07':'missed','2026-10-08':'completed'};
  assert.equal(earliestPending(defaults,answers,'2026-10-09'),'2026-10-09');
  assert.equal(canAnswer('2026-10-09',defaults,answers,'2026-10-09'),true);
  assert.equal(stats(defaults,answers).score,0);
});
test('expired dates do not auto-mark as missed; corrections replace score',()=>{
  assert.equal(stats(defaults,{}).missed,0);
  const answers={'2026-10-07':'missed'};
  assert.equal(canAnswer('2026-10-07',defaults,answers,'2026-10-20'),true);
  assert.equal(stats(defaults,answers).score,-1);
  answers['2026-10-07']='completed';assert.equal(stats(defaults,answers).score,1);
});
test('timezone rolls over at Karachi midnight across year boundary',()=>{
  assert.equal(getToday(new Date('2026-10-06T18:59:59Z')),'2026-10-06');
  assert.equal(getToday(new Date('2026-10-06T19:00:00Z')),'2026-10-07');
  assert.equal(getToday(new Date('2026-12-31T19:00:00Z')),'2027-01-01');
});
test('storage roundtrip validates shape and protects corrupt history',()=>{
  const data={version:1,plan:defaults,answers:{'2026-10-07':'completed'}};
  assert.deepEqual(readSaved(JSON.stringify(data)),{plan:defaults,answers:data.answers});
  assert.throws(()=>readSaved('{broken'));assert.throws(()=>readSaved(JSON.stringify({...data,version:99})));
  assert.throws(()=>readSaved(JSON.stringify({...data,answers:{START:'completed'}})));
  assert.throws(()=>readSaved(JSON.stringify({...data,plan:{}})));
});
test('existing browser progress migrates October 6 Reel without changing 55 chances',()=>{
  const oldPlan={...defaults,[START]:'reel',[MOVED_REEL_DATE]:null};
  const migrated=readSaved(JSON.stringify({version:1,plan:oldPlan,answers:{[START]:'missed'}}));
  assert.equal(migrated.plan[START],null);
  assert.equal(migrated.plan[MOVED_REEL_DATE],'reel');
  assert.equal(stats(migrated.plan,migrated.answers).total,55);
  assert.equal(stats(migrated.plan,migrated.answers).score,0);
});

test('any start date yields the same 90-day plan with 55 posts',()=>{
  for(const start of ['2026-10-12','2026-12-31','2028-02-20']){
    const plan=buildDefaults(start);const days=buildDates(start);
    assert.equal(days.length,90);assert.equal(days.at(-1),endDate(start));
    assert.equal(plan[start],null);assert.equal(plan[movedReelDate(start)],'reel');
    assert.equal(stats(plan,{}).total,55);
    assert.deepEqual(readSaved(JSON.stringify({version:1,plan,answers:{}}),start),{plan,answers:{}});
    assert.throws(()=>readSaved(JSON.stringify({version:1,plan,answers:{}})));
  }
  assert.deepEqual(buildDefaults(START),defaults);
});
