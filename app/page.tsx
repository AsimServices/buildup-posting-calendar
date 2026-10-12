"use client";

import { useEffect, useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, LockKeyhole, CalendarDays, SlidersHorizontal, ArrowUpRight, Film, Layers, AlignLeft, Leaf, CircleHelp } from "lucide-react";
import { Dialog } from "radix-ui";
import { KEY, buildDates, buildDefaults, endDate, movedReelDate, dateLabel, getToday, earliestPending, canAnswer, stats, readSaved, type Plan, type Answers, type PostType } from "./schedule";
import { PROFILE_KEY, readProfile, sendToSheet, type Profile } from "./profile";
import Onboarding from "./onboarding";

const typeInfo: Record<PostType, {platform: string; content: string}> = {
  reel: {platform: "Instagram", content: "Reel"}, igCarousel: {platform: "Instagram", content: "Carousel"},
  text: {platform: "LinkedIn", content: "Text post"}, liCarousel: {platform: "LinkedIn", content: "Carousel"},
};
function ContentIcon({type, size = 15}: {type: PostType; size?: number}) {return type === "reel" ? <Film size={size}/> : type === "text" ? <AlignLeft size={size}/> : <Layers size={size}/>;}
function Platform({type}: {type: PostType}) {return <span className={`platform ${type === "reel" || type === "igCarousel" ? "instagram" : "linkedin"}`}><span className="platform-symbol">{type === "reel" || type === "igCarousel" ? "◎" : "in"}</span><span className="platform-name">{typeInfo[type].platform}</span></span>;}

export default function Home() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    let saved: Profile | null = null;
    try {saved = readProfile(localStorage.getItem(PROFILE_KEY));} catch {}
    setProfile(saved);
    if (saved && !saved.synced) {
      const pendingProfile = saved;
      void sendToSheet(pendingProfile).then(sent => {
        if (!sent) return;
        const next = {...pendingProfile, synced: true};
        try {localStorage.setItem(PROFILE_KEY, JSON.stringify(next));} catch {}
        setProfile(next);
      });
    }
  }, []);

  function complete(created: Profile) {
    try {localStorage.setItem(PROFILE_KEY, JSON.stringify(created));} catch {}
    setProfile(created);
    void sendToSheet(created).then(sent => {
      if (!sent) return;
      const next = {...created, synced: true};
      try {localStorage.setItem(PROFILE_KEY, JSON.stringify(next));} catch {}
      setProfile(next);
    });
  }

  if (profile === undefined) return <div className="app-shell" aria-busy="true"/>;
  if (profile === null) return <Onboarding onComplete={complete}/>;
  return <Calendar key={profile.id} profile={profile}/>;
}

function Calendar({profile}: {profile: Profile}) {
  const START = profile.start;
  const END = endDate(START);
  const dates = buildDates(START);
  const defaults = buildDefaults(START);
  const firstMonth = START.slice(0,7);
  const lastMonth = END.slice(0,7);
  const startLabel = dateLabel(START, true);
  const setupReelLabel = dateLabel(movedReelDate(START));
  const firstPostLabel = dateLabel(dates[1]);
  const fullDate = (d: string) => new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
  const clampMonth = (day: string) => day < START ? firstMonth : day > END ? lastMonth : day.slice(0,7);
  const [plan, setPlan] = useState<Plan>(defaults);
  const [answers, setAnswers] = useState<Answers>({});
  const [today, setToday] = useState("");
  const [month, setMonth] = useState(START.slice(0,7));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Plan>(defaults);
  const [selected, setSelected] = useState<string | null>(null);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const load = () => {try {const data = readSaved(localStorage.getItem(KEY), START); setPlan(data.plan); setAnswers(data.answers); setError("");} catch {setError("Your saved progress couldn’t be read. Changes are paused to protect it. Check that browser storage is available.");}};
    const tick = () => setToday(getToday());
    tick(); load(); setReady(true);
    setMonth(clampMonth(getToday()));
    const timer = setInterval(tick, 15000);
    const sync = (event: StorageEvent) => {if(event.key === KEY || event.key === null) load();};
    window.addEventListener("storage", sync); window.addEventListener("focus", tick);
    return () => {clearInterval(timer); window.removeEventListener("storage", sync); window.removeEventListener("focus", tick);};
  }, []);

  const totals = stats(plan, answers);
  const pending = earliestPending(plan, answers, today);
  const overdue = dates.filter(d => d < today && plan[d] && !answers[d]);
  const focusDate = pending ?? (today >= START && today <= END ? today : null);
  const focusType = focusDate ? plan[focusDate] : null;
  const dayNumber = today ? Math.max(0, Math.min(90, Math.floor((Date.parse(today)-Date.parse(START))/86400000)+1)) : 1;
  const percent = totals.total ? Math.round(totals.completed/totals.total*100) : 0;
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year,monthNumber-1,1));
  const offset = (first.getUTCDay()+6)%7;
  const daysInMonth = new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  const cells = Array.from({length: Math.ceil((offset+daysInMonth)/7)*7}, (_,i) => new Date(Date.UTC(year,monthNumber-1,i-offset+1)).toISOString().slice(0,10));
  const monthLabel = first.toLocaleDateString("en-US", {month:"long",year:"numeric",timeZone:"UTC"});

  function persist(nextPlan: Plan, nextAnswers: Answers) {
    if(error) return false;
    try {localStorage.setItem(KEY,JSON.stringify({version:1,plan:nextPlan,answers:nextAnswers})); setPlan(nextPlan);setAnswers(nextAnswers);return true;}
    catch {setError("Progress couldn’t be saved. Allow browser storage, then reload and try again.");return false;}
  }
  function answer(date: string, status: "completed" | "missed") {
    try {const latest=readSaved(localStorage.getItem(KEY), START);
      if(!canAnswer(date,latest.plan,latest.answers,getToday())) {setNotice("Answer the earliest unfinished posting day first. Future dates stay locked."); return;}
      if(persist(latest.plan,{...latest.answers,[date]:status})) {setSelected(null);setNotice(`${dateLabel(date)} marked ${status}. ${status === "completed" ? "+1 point. Keep showing up." : "−1 point. A fresh start is ahead."}`);}
    } catch {setError("Your saved progress couldn’t be read. Please reload before making changes.");}
  }
  function savePlan() {
    try {const latest=readSaved(localStorage.getItem(KEY), START); const next={...latest.plan}; const now=getToday();
      dates.filter(d=>d>now).forEach(d=> {next[d]=draft[d];});
      if(persist(next,latest.answers)){setEditing(false);setNotice("Your upcoming posting schedule is updated.");}
    } catch {setError("Your saved schedule couldn’t be read. Please reload before making changes.");}
  }
  function navigate(delta: number) {const next=new Date(Date.UTC(year,monthNumber-1+delta,1)).toISOString().slice(0,7);if(next>=firstMonth && next<=lastMonth)setMonth(next);}
  function goToday(){setMonth(clampMonth(today));}

  useEffect(() => {
    if(!ready) return;
    const context=(document as Document & {modelContext?: {registerTool: (tool: unknown, options: {signal: AbortSignal}) => void | Promise<void>}}).modelContext;
    if(!context) return;
    const lifecycle=new AbortController();
    try {void Promise.resolve(context.registerTool({name:"read_posting_calendar",title:"Read posting accountability calendar",description:"Read the 90-day posting schedule, answers, progress, and earliest unresolved publishing day.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({start:START,end:END,today,plan,answers,totals,earliestPending:pending})},{signal:lifecycle.signal})).catch(()=>{});} catch {}
    return ()=>lifecycle.abort();
  }, [ready,today,plan,answers]);

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="BuildUp.pk 90-Day Posting Calendar home"><span className="logo-image-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-image" src="/buildup-logo.png" alt="BuildUp" width={384} height={384}/>
    </span><strong className="logo-title">90-Day Posting Calendar</strong></a><div className="nav-item"><CalendarDays size={17}/> My calendar</div><div className="topbar-right"><span className="challenge-tag">BUILDUP.PK</span><button className="icon-button" aria-label="How this challenge works" onClick={()=>setHelp(true)}><CircleHelp size={20}/></button><span className="avatar" aria-label={`${profile.name}'s challenge`} title={profile.name}>{profile.name.trim().charAt(0).toUpperCase()}</span></div></header>
    <main>
      <div className="page-heading"><div><div className="eyebrow">CONSISTENCY STARTS HERE</div><h1>Your next 90 days.</h1><p>One post at a time. Every day accounted for.</p></div><button className="button secondary edit-button" onClick={()=>{setDraft({...plan});setEditing(true);}} disabled={!ready || !!error} aria-label="Edit schedule"><SlidersHorizontal size={16}/><span>Edit schedule</span></button></div>
      <div className="challenge-line"><span><CalendarDays size={15}/> {fullDate(START)} <span className="date-dash">—</span> {fullDate(END)}</span><span className="day-pill">{today && today<START ? `STARTS ${startLabel.toUpperCase()}` : `DAY ${dayNumber} OF 90`}</span></div>
      {error && <div className="error-message" role="alert">{error}</div>}
      <section className="stats-row" aria-label="Challenge progress">
        <div className="progress-stat"><div className="stat-label">Publishing progress <span>{percent}%</span></div><div className="stat-value">{totals.completed}<span>/ {totals.total} posts completed</span></div><div className="progress-track" role="progressbar" aria-label="Posts completed" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${percent}%`}}/></div></div>
        <div className="small-stat"><span className="stat-label"><span className="mini-icon green"><Check size={13}/></span> Completed</span><strong>{totals.completed.toString().padStart(2,"0")}</strong><span className="stat-foot">You showed up</span></div>
        <div className="small-stat"><span className="stat-label"><span className="mini-icon red"><X size={13}/></span> Missed</span><strong>{totals.missed.toString().padStart(2,"0")}</strong><span className="stat-foot">Own it. Keep going.</span></div>
        <div className="small-stat"><span className="stat-label"><span className="remaining-circle"/> Remaining</span><strong>{totals.remaining.toString().padStart(2,"0")}</strong><span className="stat-foot">Chances to show up</span></div>
        <div className="score-stat"><span>CURRENT SCORE <ArrowUpRight size={17}/></span><strong>{totals.score > 0 ? "+" : ""}{totals.score}<small>pts</small></strong><span className="score-foot">Posted +1 <span>·</span> Missed −1</span></div>
      </section>
      <div className="workspace">
        <section className="calendar-panel" aria-label="Posting calendar">
          <div className="calendar-toolbar"><div><h2>{monthLabel}</h2><span>{dates.filter(d=>d.startsWith(month)&&plan[d]).length} posts scheduled</span></div><div className="month-controls"><button className="today-button" onClick={goToday} disabled={!ready}>Today</button><button className="icon-button" aria-label="Previous month" onClick={()=>navigate(-1)} disabled={month===firstMonth}><ChevronLeft size={19}/></button><button className="icon-button" aria-label="Next month" onClick={()=>navigate(1)} disabled={month===lastMonth}><ChevronRight size={19}/></button></div></div>
          <div className="weekdays">{["MON","TUE","WED","THU","FRI","SAT","SUN"].map(d=><span key={d}>{d}</span>)}</div>
          <div className="calendar-grid">{cells.map(date=>{
            const outside=date<START||date>END||!date.startsWith(month);
            const type=outside?null:plan[date]; const status=outside?undefined:answers[date]; const isToday=date===today;
            const needsAnswer=!!type && !status && date<today; const available=ready && !error && canAnswer(date,plan,answers,today);
            const locked=!!type && !status && !available;
            return <div key={date} data-date={date} aria-label={`${dateLabel(date)}${outside?", outside challenge":date===START?", profile setup day":type?`, ${typeInfo[type].platform} ${typeInfo[type].content}, ${status|| (needsAnswer?"requires a decision":date>today?"upcoming":"today")}`:", rest day"}`} className={`day-cell ${outside?"outside":date===START?"setup":type?"scheduled":"rest"} ${isToday?"is-today":""} ${status||""} ${needsAnswer?"needs-answer":""}`}>
              <div className="day-top"><span className="day-number">{Number(date.slice(-2))}</span>{isToday?<span className="today-label">TODAY</span>:locked?<LockKeyhole size={12}/>:status?<span className="points">{status==="completed"?"+1":"−1"}</span>:null}</div>
              {outside?<span className="outside-dash">—</span>:date===START?<><span className="setup-icon"><SlidersHorizontal size={17}/></span><span className="setup-title">Profile setup</span><span className="setup-caption">Instagram + LinkedIn</span></>:type?<><Platform type={type}/><div className="content-type"><ContentIcon type={type}/>{typeInfo[type].content}</div>
              {status?<button className="outcome-button" onClick={()=>setSelected(date)} disabled={!ready||!!error||date>today} aria-label={`Change answer for ${dateLabel(date)}, currently ${status}`}><span className="large-check">{status==="completed"?<Check size={26}/>:<X size={26}/>}</span><span>{status=== "completed"?"COMPLETED":"MISSED"}</span></button>:available?<div className="day-actions"><button onClick={()=>answer(date,"completed")} aria-label={`Mark ${dateLabel(date)} posted`}><Check size={16}/></button><button onClick={()=>answer(date,"missed")} aria-label={`Mark ${dateLabel(date)} missed`}><X size={16}/></button></div>:<span className={`day-caption ${needsAnswer?"overdue-caption":""}`}>{needsAnswer?"Answer earlier day":date>today?"Upcoming":"Locked"}</span>}
              </>:<span className="rest-label">— <span>Rest day</span></span>}
            </div>;
          })}</div>
          <div className="calendar-legend"><span><i className="legend-square setup"/>Setup day</span><span><i className="legend-square complete"/>Completed</span><span><i className="legend-square missed"/>Missed</span><span><i className="legend-square upcoming"/>Upcoming</span><span><i className="legend-square rest"/>Rest day</span><span className="lock-legend"><LockKeyhole size={12}/> Future days unlock daily</span></div>
        </section>
        <aside className="side-column">
          <section className={`focus-card ${focusDate && answers[focusDate] ? answers[focusDate] : ""}`}>
            <div className="focus-eyebrow"><span className="focus-dot"/>{overdue.length?"YOUR NEXT CHECK-IN":"TODAY’S FOCUS"}<span>{focusDate?dateLabel(focusDate,true):"90 DAYS"}</span></div>
            {!ready ? <><h2>Your calendar is loading.</h2><p>Getting your saved progress.</p></> : focusType && focusDate ? <>
              <div className="focus-content-icon"><ContentIcon type={focusType} size={25}/></div><h2>{typeInfo[focusType].platform} <span>{typeInfo[focusType].content}</span></h2>
              <p>{answers[focusDate] ? answers[focusDate]==="completed" ? "You showed up. That’s what counts." : "An honest check-in. Keep moving forward." : overdue.length ? `${dateLabel(focusDate)} needs an answer before the next posting day unlocks.` : "Your plan is set. Make today count."}</p>
              {answers[focusDate]?<button className="button focus-change" onClick={()=>setSelected(focusDate)} disabled={!!error}>{answers[focusDate]==="completed"?<Check size={18}/>:<X size={18}/>} {answers[focusDate]==="completed"?"Completed · +1 point":"Missed · −1 point"}</button>:<><div className="focus-divider"/><h3>Did you publish this?</h3><div className="focus-actions"><button className="button posted" onClick={()=>answer(focusDate,"completed")} disabled={!!error}><Check size={17}/> Yes, posted</button><button className="button not-posted" onClick={()=>answer(focusDate,"missed")} disabled={!!error}><X size={17}/> Missed</button></div><span className="focus-note">An honest answer is progress, too.</span></>}
            </> : today===START?<><div className="focus-content-icon setup-focus-icon"><SlidersHorizontal size={26}/></div><h2>Set up your profiles.</h2><p>Get Instagram and LinkedIn ready: profile photos, bios, links, and posting settings. Your Reel moves to {setupReelLabel}. Today has no posting check-in or score.</p></> : <><div className="focus-content-icon"><Leaf size={26}/></div><h2>{today<START?"Ready when you are.":today>END?"90 days. Accounted for.":"Room to recharge."}</h2><p>{today<START?`Your setup day is ${dateLabel(START)}. Your first post is ${firstPostLabel}.`:today>END?"Your challenge is complete. Every honest check-in counts.":"It’s a rest day. Your next scheduled post will unlock on its date."}</p></>}
          </section>
          <section className="journey-card"><div className="section-heading"><h3>The big picture</h3><span>90 days</span></div><div className="journey-grid" aria-label="All 90 challenge days">{dates.map(d=><span key={d} className={`journey-day ${d===START?"setup":answers[d]||(!plan[d]?"rest":"")} ${d===today?"current":""}`} title={`${dateLabel(d)} · ${d===START?"Profile setup":answers[d]|| (plan[d]?typeInfo[plan[d]!].platform+" "+typeInfo[plan[d]!].content:"Rest day")}`}/>)}</div><div className="journey-range"><span>{startLabel.toUpperCase()}</span><span>{dateLabel(END,true).toUpperCase()}</span></div><p>Small actions.<br/><strong>A visible difference.</strong></p></section>
          <div className="rule-note"><LockKeyhole size={17}/><p><strong>One day at a time.</strong> Answer past posting days to unlock today. Nothing is marked missed automatically.</p></div>
        </aside>
      </div>
      <footer><span><span className="saved-dot"/> {error?"Storage needs attention":ready?"Saved in this browser":"Loading progress"}</span><span>Your calendar. Your commitment.</span><span>Time zone: Asia/Karachi</span></footer>
      <div className="sr-only" role="status" aria-live="polite">{notice}</div>
    </main>
    <Dialog.Root open={editing} onOpenChange={setEditing}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content schedule-dialog"><div className="dialog-heading"><div><Dialog.Title>Edit your schedule</Dialog.Title><Dialog.Description>Choose what to post on upcoming days. {dateLabel(START)} is reserved for profile setup; past days and today stay fixed.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close schedule editor"><X size={20}/></Dialog.Close></div><div className="schedule-list">{dates.map(d=><label className={`schedule-row ${d<=today?"frozen":""}`} key={d}><span><strong>{dateLabel(d)}</strong><small>{new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",timeZone:"UTC"})}{d===START?" · Profile setup":d<=today?" · Locked":""}</small></span><select aria-label={`Schedule for ${dateLabel(d)}`} disabled={d<=today||d===START} value={draft[d]??"rest"} onChange={e=>setDraft({...draft,[d]:e.target.value==="rest"?null:e.target.value as PostType})}><option value="rest">{d===START?"Profile setup":"Rest day"}</option>{d!==START&&Object.entries(typeInfo).map(([value,info])=><option key={value} value={value}>{info.platform} — {info.content}</option>)}</select></label>)}</div><div className="dialog-footer"><span>{Object.values(draft).filter(Boolean).length} posting days</span><Dialog.Close className="button secondary">Cancel</Dialog.Close><button className="button primary" onClick={savePlan}>Save schedule</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={!!selected} onOpenChange={open=>!open&&setSelected(null)}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content small-dialog"><Dialog.Title>Update your check-in</Dialog.Title><Dialog.Description>{selected?dateLabel(selected):""} · Choose the answer that reflects what happened. Your score will update.</Dialog.Description><div className="correction-actions"><button className="button posted" onClick={()=>selected&&answer(selected,"completed")}><Check size={18}/> Posted · +1</button><button className="button not-posted" onClick={()=>selected&&answer(selected,"missed")}><X size={18}/> Missed · −1</button></div><Dialog.Close className="button secondary full-width">Cancel</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={help} onOpenChange={setHelp}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content small-dialog"><div className="dialog-heading"><Dialog.Title>Just show up.</Dialog.Title><Dialog.Close className="icon-button" aria-label="Close help"><X size={20}/></Dialog.Close></div><Dialog.Description>A simple commitment for 90 days.</Dialog.Description><ul className="help-list"><li><Check size={18}/> Publish your scheduled post and mark it completed. Earn 1 point.</li><li><X size={18}/> Didn’t post? Own it with a missed check-in. Lose 1 point.</li><li><LockKeyhole size={18}/> Answer the earliest unresolved day first. Future days unlock at midnight in Karachi.</li><li><Leaf size={18}/> Rest days don’t need a check-in. They don’t affect your score.</li></ul><p className="storage-explanation">Progress stays in this browser on this device. Clearing browser data will remove it. Your progress does not sync across devices.</p></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
