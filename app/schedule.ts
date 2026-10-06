export const START = "2026-10-06";
export const END = "2027-01-03";
export const KEY = "show-up-90-v1";
export type PostType = "reel" | "igCarousel" | "text" | "liCarousel";
export type Plan = Record<string, PostType | null>;
export type Answers = Record<string, "completed" | "missed">;
export const dates = Array.from({length:90},(_,i)=>new Date(Date.parse(START)+i*86400000).toISOString().slice(0,10));
export const defaults: Plan = Object.fromEntries(dates.map((d,i)=>{const day=new Date(d+"T12:00:00Z").getUTCDay(); return [d,day===2?"reel":day===3?"text":day===5?"igCarousel":day===0?"liCarousel":[6,34,62].includes(i)?"text":null];}));
export function getToday(now=new Date()) {const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Karachi",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);const part=(type:string)=>parts.find(p=>p.type===type)!.value;return `${part("year")}-${part("month")}-${part("day")}`;}
export function dateLabel(date: string, short=false) {return new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{month:short?"short":"long",day:"numeric",timeZone:"UTC"});}
export function earliestPending(plan: Plan, answers: Answers, today: string) {return dates.find(d=>d<=today && plan[d] && !answers[d])??null;}
export function canAnswer(date: string, plan: Plan, answers: Answers, today: string) {return !!today && dates.includes(date) && !!plan[date] && date<=today && (!!answers[date] || earliestPending(plan,answers,today)===date);}
export function stats(plan: Plan, answers: Answers) {const total=dates.filter(d=>plan[d]).length;const completed=dates.filter(d=>plan[d]&&answers[d]==="completed").length;const missed=dates.filter(d=>plan[d]&&answers[d]==="missed").length;return {total,completed,missed,remaining:total-completed-missed,score:completed-missed};}
export function readSaved(raw: string | null): {plan:Plan; answers:Answers} {
  if(!raw) return {plan:{...defaults},answers:{}};
  const data=JSON.parse(raw);
  if(data.version!==1 || !data.plan || !data.answers || typeof data.plan!=="object" || typeof data.answers!=="object" || Array.isArray(data.plan) || Array.isArray(data.answers)) throw new Error("Invalid saved calendar");
  const allowed=[null,"reel","igCarousel","text","liCarousel"];
  if(dates.some(d=>!Object.hasOwn(data.plan,d)||!allowed.includes(data.plan[d]))) throw new Error("Invalid schedule");
  if(Object.entries(data.answers).some(([d,v])=>!dates.includes(d)||!data.plan[d]||!["completed","missed"].includes(String(v)))) throw new Error("Invalid answers");
  return {plan:Object.fromEntries(dates.map(d=>[d,data.plan[d]])),answers:data.answers};
}
