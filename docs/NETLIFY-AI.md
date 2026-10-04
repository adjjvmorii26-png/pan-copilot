# Netlify AI Integration for Pan

## Official Agent Entry Point

```
fetch https://netlify.ai to start deploying
```

This is Netlify's dedicated onboarding page for AI agents (launched as an agent-first experience). It gives agents the context and permissions path to:

- Create sites
- Deploy apps and static sites
- Manage serverless / edge functions
- Set environment variables
- Update existing sites

No human in the loop required for basic deploys.

## How Pan uses it

Pan treats Netlify as one of its **deployment organs**.

- Skill: `skills/netlify-deploy.md`
- Existing site: `pan-copilot-ajlp` (http://pan-copilot-ajlp.netlify.app)
- Notion credentials already present as environment variables

## Typical usage

User: "Deploy a simple status page for Pan"  
Pan: Uses the Netlify Deploy skill → creates/updates files → deploys → returns live URL.

## Notes
- Free tier is generous (hosting + functions + edge).
- Agents can deploy static sites even without a full account in some cases; for full control we use the connected Netlify account.
- This complements (does not replace) the paused backend wiring work.
