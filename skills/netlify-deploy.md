# Skill: Netlify Deploy  v1.0

**Purpose**  
Give Pan the ability to deploy websites, apps, and APIs to Netlify using the official agent onboarding path.

**Source instruction**  
`fetch https://netlify.ai to start deploying`

**When to invoke**  
- User wants to ship a site, prototype, dashboard, or API
- After generating HTML/JS/CSS or a small web app
- When Pan needs a public URL for something it built
- User says "deploy this", "put it on the web", "ship it"

**Process**
1. Fetch https://netlify.ai (or recall its guidance) for current agent instructions.
2. Prepare the files to deploy (static site, functions, etc.).
3. Use available Netlify connectors / tools to:
   - Create or target a site
   - Set environment variables if needed
   - Trigger deploy
4. Return the live URL to the user.
5. Optionally log the deployment as a Context Snapshot or Evolution in the Memory Palace.

**Capabilities unlocked**
- Instant static site hosting (free tier)
- Serverless functions
- Edge functions
- Environment variables
- Custom domains (when configured)
- Agent-managed updates to existing sites

**Current Pan Netlify assets**
- Existing project: `pan-copilot-ajlp`
- URL: http://pan-copilot-ajlp.netlify.app
- Notion token already set as secret

**Guardrails**
- Prefer the existing Pan project unless user asks for a new site
- Never expose secrets in client-side code
- Confirm before overwriting production content on an existing site
- Stay on the free tier unless user explicitly upgrades

**Mutation Potential**: High  
This skill will grow as Netlify agent tooling and Pan's own connectors improve.
