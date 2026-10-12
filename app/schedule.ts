export const KEY = "buildup-posting-calendar-v1";
export type PostType = "reel" | "igCarousel" | "text" | "liCarousel";
export type Plan = Record<string, PostType | null>;
export type Answers = Record<string, "completed" | "missed">;
export const CHALLENGE_DAYS = 90;
export function addDays(date: string, n: number) {return new Date(Date.parse(date)+n*86400000).toISOString().slice(0,10);}
export function buildDates(start: string) {return Array.from({length:CHALLENGE_DAYS},(_,i)=>addDays(start,i));}
export function endDate(start: string) {return addDays(start,CHALLENGE_DAYS-1);}
export function movedReelDate(start: string) {return addDays(start,2);}
// The weekly rhythm is relative to the start day (day 1 is profile setup), so every start date gets the same 55 posts.
export function buildDefaults(start: string): Plan {
  return Object.fromEntries(buildDates(start).map((d,i)=>{const day=(2+i)%7; return [d,i===0?null:i===2?"reel":day===2?"reel":day===3?"text":day===5?"igCarousel":day===0?"liCarousel":[6,34,62].includes(i)?"text":null];}));
}
// Reference schedule for 6 Oct 2026, kept for tests.
export const START = "2026-10-06";
export const END = endDate(START);
export const MOVED_REEL_DATE = movedReelDate(START);
export const dates = buildDates(START);
export const defaults: Plan = buildDefaults(START);
export function getToday(now=new Date()) {const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Karachi",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);const part=(type:string)=>parts.find(p=>p.type===type)!.value;return `${part("year")}-${part("month")}-${part("day")}`;}
export function dateLabel(date: string, short=false) {return new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{month:short?"short":"long",day:"numeric",timeZone:"UTC"});}
export function earliestPending(plan: Plan, answers: Answers, today: string) {return Object.keys(plan).sort().find(d=>d<=today && plan[d] && !answers[d])??null;}
export function canAnswer(date: string, plan: Plan, answers: Answers, today: string) {return !!today && Object.hasOwn(plan,date) && !!plan[date] && date<=today && (!!answers[date] || earliestPending(plan,answers,today)===date);}
export function stats(plan: Plan, answers: Answers) {const days=Object.keys(plan);const total=days.filter(d=>plan[d]).length;const completed=days.filter(d=>plan[d]&&answers[d]==="completed").length;const missed=days.filter(d=>plan[d]&&answers[d]==="missed").length;return {total,completed,missed,remaining:total-completed-missed,score:completed-missed};}
export function readSaved(raw: string | null, start=START): {plan:Plan; answers:Answers} {
  const dates=buildDates(start);
  if(!raw) return {plan:buildDefaults(start),answers:{}};
  const data=JSON.parse(raw);
  if(data.version!==1 || !data.plan || !data.answers || typeof data.plan!=="object" || typeof data.answers!=="object" || Array.isArray(data.plan) || Array.isArray(data.answers)) throw new Error("Invalid saved calendar");
  const allowed=[null,"reel","igCarousel","text","liCarousel"];
  if(dates.some(d=>!Object.hasOwn(data.plan,d)||!allowed.includes(data.plan[d]))) throw new Error("Invalid schedule");
  if(Object.entries(data.answers).some(([d,v])=>!dates.includes(d)||!data.plan[d]||!["completed","missed"].includes(String(v)))) throw new Error("Invalid answers");
  const plan: Plan=Object.fromEntries(dates.map(d=>[d,data.plan[d]]));
  const answers: Answers={...data.answers};
  if(plan[start]) {
    const openDate=!plan[movedReelDate(start)]?movedReelDate(start):dates.find(d=>d>start&&!plan[d]);
    if(openDate) plan[openDate]=plan[start];
    plan[start]=null;
    delete answers[start];
  }
  return {plan,answers};
}
