# Personal CRM — Setup

## For building the project with Claude Code

1. Install Claude Code and login as described [here](https://code.claude.com/docs/en/quickstart#step-1-install-claude-code)
2. Start Claude with `claude --permission-mode auto`
3. Enter: `Build the entire project; only stop when success criteria are met and the product is running`

## For building with Codex, Cursor or Antigravity

1. Exactly the same instructions, but substitute your favorite Coding Agent!

## For building with Pi and Open-Source models

Open a terminal and run:
`git checkout pi`

This README should be updated automatically; follow the new instructions
## Running the app

Run `npm install` once, then start the CRM with a single command:

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser. The app is single-user and fully local: no
accounts, no cloud, no internet required. Its data lives in a local SQLite file (`crm.sqlite3`,
gitignored) which is seeded with realistic sample data on first launch, so every screen looks alive
immediately. Run the unit tests any time with `npm test`.
Edited by the agent harness.
