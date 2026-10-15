# Calendar organ for Pan

## Why ICS?
The browser panel’s backend (Vercel) cannot use Grok’s Google Calendar connector.  
A **secret iCal URL** is the standard way to feed a private calendar into a server.

## Setup (2 minutes)
1. Google Calendar (web) → Settings → select your calendar
2. **Integrate calendar** → **Secret address in iCal format**
3. Copy the URL
4. Vercel project `pan-copilot` → Environment Variables →
   `CALENDAR_ICS_URL` = that URL (all environments)
5. Redeploy

## Verify
```bash
curl -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize \
  -H 'Content-Type: application/json' \
  -d '{"query":"agenda"}'
```
Expect `meta.live.calendar: true` and Calendar signals.

## Connector path (this chat)
Grok can list/create events via Google Calendar tools directly — used for rituals and seeding.
