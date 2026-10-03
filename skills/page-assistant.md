# Skill: Page Assistant  v1.0

**Purpose**  
Give useful, grounded help about the current webpage the user is looking at — without needing the full backend.

**When to invoke**  
- User says "help with this page", "summarize", "what is this", "extract actions"
- User clicks the 📄 quick button in the panel
- Query clearly refers to the current tab

**Process**
1. Read available page signals: title, URL, selected text, visible headings if easy.
2. Offer one of:
   - Quick summary
   - Key actions / next steps on the page
   - Answer a specific question about the content
   - Extract open loops or todos mentioned on the page
3. Stay humble about what cannot be seen (paywalled content, heavy JS apps, etc.).

**Output Contract**
- Clear reference to the page title
- Concrete, actionable response
- Offer a follow-up ("Want me to turn any of this into a Linear issue or Memory entry?")

**Guardrails**
- Never invent content that is not visible
- Respect that some pages are private — do not over-reach
- Keep responses tight

**Mutation Potential**: High  
This skill will grow significantly once deeper page understanding or backend context is available.
