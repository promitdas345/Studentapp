# AI use log

BUSI 3630 allows generative AI but requires citing the full prompt sequence. Add one row per session: Promit's prompts in his own words, in order, and what came out of it.

| Date | Tool | What Promit asked (in order) | What it produced |
|---|---|---|---|
| 2026-10-20 | Claude (Anthropic), in the "business 3630" Project | "lets start building the app give me everything necessary to give to cowork to get started" · "save everything necessary in memory to help me in the future after you are done" · "start from where you left" | This starter kit (START_HERE, KICKOFF_PROMPT, CLAUDE.md and docs/), written from the team's round 1 interview notes, earlier research and decisions |
| 2026-10-20 to 2026-10-21 | Claude Code (Anthropic), cloud session | (1) Attached the starter kit zip with no message · (2) "github is connected", with a screenshot of the GitHub connector settings | Read the kit and replied with the build plan, 7 unclear or conflicting points and the list of things needed from Promit. Read the current Expo and Supabase docs (source on GitHub, because the websites were blocked) and built Milestone 0: the Expo app (SDK 57), the Supabase connection with a secret-key guard and tests, the setup-check screen, the `hello` SQL file, and doc updates. |
