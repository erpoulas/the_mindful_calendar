@AGENTS.md

## Working agreements

- Never read, write, or edit the real `.env` file — only `.env.example`.
- Never add `Co-Authored-By: Claude` to commits in this repo.
- Follow KISS/DRY/SOLID: no speculative abstractions, no unrequested cleanup, no duplicated logic.
- Check for existing patterns/code to reuse before writing something new; favor OOP where it fits the existing style.
- Keep data access (`src/lib/*.ts`), business logic, and UI in separate layers — this project follows TDD, with data-access functions written and tested before any UI is wired to them.
- Use clear, easy-to-understand names — no cryptic abbreviations.
- Push to GitHub after every commit; don't batch multiple commits before pushing.
- Before starting a new feature, explain where it sits in the plan (`project-summary.md`) and what it maps to.
- After finishing a feature, recap any real bugs/difficulties hit and how they were resolved, separate from ordinary tooling friction.
- Explain things plainly — this project owner is new to Next.js/Prisma/Supabase/TDD.
- Don't read files outside this repo directory without asking first.
