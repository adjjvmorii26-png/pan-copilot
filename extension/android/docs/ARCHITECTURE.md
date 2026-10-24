# Pan on Android — Architecture (Option A primary)

**Decision:** Full HUD App as product path. Option C for same-day smoke. Option B deferred.

Chrome SW → WorkManager + Coroutines; storage.local → DataStore; content script → WebView/Compose; alarms → WorkManager periodic.

Failover: local → Manus/alexalex → Vercel. Ambient: https URL only, alpha ~0.18, Coil.
