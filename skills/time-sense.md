# Skill: Time Sense  v1.0

**Purpose**  
Bring calendar / schedule awareness into Context Synthesis so Pan reasons about *when*, not only *what*.

**Sources (in order)**
1. **ICS feed** — `CALENDAR_ICS_URL` on Vercel (Google Calendar → Settings → Integrate calendar → Secret address in iCal format)
2. **Client events** — optional `calendarEvents` array on synthesize POST
3. **Grok connector** — full Google Calendar when working in this chat

**When to invoke**  
- Morning Oracle
- “What’s on today?”
- Before scheduling or stacking work on top of meetings

**Process**
1. Pull next 24–48h events.
2. Score near-term events high in synthesis.
3. Recommend protecting focus blocks or prep for the next event.

**Output**  
Calendar signals as `today 9:00 AM: …` style lines in synthesis.

**Guardrails**  
Never invent meetings. Empty calendar is valid signal.

**Mutation Potential**: Medium
