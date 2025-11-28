## High-level behavior

- Keep responses concise without taking shortcuts that affect code quality.
- Do not run terminal commands unless explicitly told to.
- When asked a general/design question (e.g. should I add this feature, should I work on this task next) prefer answering with words while showing no code.
- When asked a coding-related question (e.g. how to implement this feature, how to fix this error) prefer example implementations and code snippets over generating full code for me.

## Project structure

- `src/` - source code for NextJS Project
- `functions/` - code for Firebase Cloud Functions.
- `docs/` - Markdown documentation files.

## Code generation rules

- Write code for humans first; maintain readability and maintainability over compact cleverness.
- Keep generated code small and focused; avoid unnecessary abstractions or redundant wrappers/hooks.

## Code style, linting & formatting

- Follow project linting and formatting: `eslint.config.mjs` and `prettier.config.js`. Fix all linting and formatting errors in generated code.
- Ensure generated commit messages follow Conventional Commits and keep commit summaries ≤ 72 characters.

## Languages, frameworks & versions

- Use ESM.
- Use TypeScript.
- Use React 19, Next.js 15, Tailwind 4, and Firebase 12. Be aware of breaking changes and deprecated features.

## React & component rules

- Prefer functional components and React hooks for state and lifecycle. Use client components only for interactivity; prefer server components otherwise.
- Use arrow functions for component functions
- Do not use `React.FC`.
- Use React Context for shared state where appropriate; avoid redundant wrappers/contexts.
- Keep functions small and single-responsibility
- Favor declarative code over imperative.

## Imports, modules & dependencies

- Avoid introducing new dependencies unless explicitly approved; prefer built-in APIs and existing utilities.
- Reuse existing utilities and types (`/types`, `types.ts`) before adding duplicates.

## File edits, diffs & refactoring

- When modifying code: aim for the smallest possible diff that accomplishes the change, while still using clean, readable, and maintainable code.
- Do not rewrite/refactor unrelated parts of a file unless required for correctness or explicitly requested.
- Consider existing file structure, naming conventions, types, and utilities before adding files or types.

## Error handling & async

- Use async/await for promises and handle errors with try/catch.
- Always handle errors gracefully and avoid exposing raw error objects to the UI.
- Put network/database calls in separate modules.

## Styling & UI

- Use Tailwind (class names) for styling. Follow a mobile-first approach and ensure responsive designs for mobile and desktop.
- Organize Tailwind classes logically (layout → spacing → colors → states).
- Ensure semantic HTML and accessibility best practices (alt text, ARIA where appropriate).

## Testing

- Use Jest and React Testing Library. Place test files next to the component under test.
- Mock modules that perform network/database calls.
- Keep tests deterministic; avoid real network calls or timers.
- Focus tests on user-visible behavior instead of implementation details.

## Commits & PRs

- Ensure commit messages follow Conventional Commits; keep summaries within 72 characters.
