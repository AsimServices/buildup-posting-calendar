"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Sparkles } from "lucide-react";
import { addDays, endDate, getToday } from "./schedule";
import { EMAIL_MAX, NAME_MAX, NOTE_MAX, firstName, isValidEmail, isValidName, isValidStart, newId, type Profile } from "./profile";

const STEPS = 4;
const fullDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric", timeZone: "UTC"});

export default function Onboarding({onComplete}: {onComplete: (profile: Profile) => void}) {
  const [today] = useState(getToday);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [start, setStart] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const first = firstName(name);
  const lastStart = addDays(today, 365);

  function go(next: number, direction: "forward" | "back") {setError(""); setDir(direction); setStep(next);}

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 0 && !isValidName(name)) return setError("Please tell us your name.");
    if (step === 1 && !isValidEmail(email)) return setError("Enter a valid email address.");
    if (step === 2 && (!isValidStart(start) || start < today || start > lastStart)) return setError("Pick a start date from today onward.");
    if (step < STEPS - 1) return go(step + 1, "forward");
    onComplete({id: newId(), name: name.trim(), email: email.trim().toLowerCase(), note: note.trim(), start, synced: false});
  }

  return <div className="ob-shell">
    <header className="ob-header">
      <span className="logo-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-image" src="/buildup-logo.png" alt="BuildUp" width={384} height={384}/>
      </span>
      <strong className="logo-title">90-Day Posting Calendar</strong>
    </header>
    <main className="ob-main">
      <div className="ob-progress" aria-label={`Step ${step + 1} of ${STEPS}`} role="img">
        {Array.from({length: STEPS}, (_, i) => <span key={i} className={i <= step ? "on" : ""}/>)}
        <small>{String(step + 1).padStart(2, "0")} / {String(STEPS).padStart(2, "0")}</small>
      </div>
      <form key={step} className={`ob-step ob-${dir}`} onSubmit={submit} noValidate>
        {step === 0 && <>
          <div className="eyebrow">WELCOME TO BUILDUP.PK</div>
          <h1>Let&apos;s build your <span>90 days.</span> What&apos;s your name?</h1>
          <label className="sr-only" htmlFor="ob-name">Your name</label>
          <input id="ob-name" className="ob-input" autoFocus autoComplete="name" maxLength={NAME_MAX} placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/>
        </>}
        {step === 1 && <>
          <div className="eyebrow">NICE TO MEET YOU</div>
          <h1>Great to have you, <span>{first}.</span> What&apos;s your email?</h1>
          <p className="ob-hint">Use the same email you joined the BuildUp community with, so we can recognise you.</p>
          <label className="sr-only" htmlFor="ob-email">Email address</label>
          <input id="ob-email" className="ob-input" type="email" autoFocus autoComplete="email" inputMode="email" maxLength={EMAIL_MAX} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/>
        </>}
        {step === 2 && <>
          <div className="eyebrow">YOUR DAY ONE</div>
          <h1><span>{first},</span> when does your journey begin?</h1>
          <p className="ob-hint">Your 90 days start on the date you pick. Day 1 is profile setup, and posting begins the day after.</p>
          <div className="ob-date-row">
            <button type="button" className={`ob-today ${start === today ? "active" : ""}`} onClick={() => {setStart(today); setError("");}}>{start === today ? <Check size={16}/> : <Sparkles size={16}/>} Start today</button>
            <span>or pick a date</span>
            <label className="sr-only" htmlFor="ob-start">Start date</label>
            <input id="ob-start" className="ob-input ob-date" type="date" min={today} max={lastStart} value={start} onChange={e => setStart(e.target.value)}/>
          </div>
          {isValidStart(start) && start >= today && start <= lastStart && <div className="ob-range"><CalendarDays size={16}/> <span><b>Day 1</b> {fullDate(start)}</span><i/> <span><b>Day 90</b> {fullDate(endDate(start))}</span></div>}
        </>}
        {step === 3 && <>
          <div className="eyebrow">ONE LAST THING</div>
          <h1>How committed are you, <span>{first}?</span></h1>
          <p className="ob-hint">Optional, but we love knowing. What are you building, and how much effort will you put in?</p>
          <label className="sr-only" htmlFor="ob-note">Your note</label>
          <textarea id="ob-note" className="ob-input ob-note" autoFocus rows={5} maxLength={NOTE_MAX} placeholder="I'm ready to show up every day because… I'll put in about … hours a week to…" value={note} onChange={e => setNote(e.target.value)}/>
          <small className="ob-count">{note.length} / {NOTE_MAX}</small>
        </>}
        <div className="ob-error" role="alert">{error}</div>
        <div className="ob-actions">
          {step > 0 && <button type="button" className="ob-back" onClick={() => go(step - 1, "back")}><ArrowLeft size={16}/> Back</button>}
          <button type="submit" className="button primary ob-next">{step === STEPS - 1 ? <>Start my 90 days <Check size={18}/></> : <>Next <ArrowRight size={18}/></>}</button>
        </div>
      </form>
    </main>
  </div>;
}
