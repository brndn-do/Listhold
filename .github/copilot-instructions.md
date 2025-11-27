## High-level behavior

- Do not run terminal commands unless explicitly told to.
- For simple tasks, implement immediately. For complex tasks, break them into small logical steps and proceed step-by-step.
- Ask for clarification only when instructions are truly ambiguous or a missing type/module must be located before generating code.
- Ask for permission before proposing large changes (new architecture, major refactors, or file reorganization).

## Project structure

- `src/` - source code for frontend
- `functions/` - code for Firebase Cloud Functions.
- `docs/` - Markdown documentation files.

## Code generation rules

- Write code for humans first; maintain readability and maintainability over compact cleverness.
- Keep generated code small and focused; avoid unnecessary abstractions or redundant wrappers/hooks.
- Remove dead code and unused imports.
- Ensure generated code passes linting, formatting, and type checks; if any generated output violates rules in this file, revise automatically.

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

- Import functions and types explicitly by name.
- Keep imports organized (external libs first, internal modules next, types last).
- Avoid introducing new dependencies unless explicitly approved; prefer built-in APIs and existing utilities.
- Reuse existing utilities and types (`/types`, `types.ts`) before adding duplicates.
- Do not inline credentials or secrets; use environment variables.

## File edits, diffs & refactoring

- When modifying code: aim for the smallest possible diff that accomplishes the change, while still using clean, readable, and maintainable code.
- Do not rewrite/refactor unrelated parts of a file unless required for correctness or explicitly requested.
- Consider existing file structure, naming conventions, types, and utilities before adding files or types.

## Naming, comments & docs

- Use PascalCase for components, camelCase for variables/functions, kebab-case for filenames, and SCREAMING_SNAKE_CASE for constants.
- Use meaningful, descriptive names.
- Add brief, meaningful comments only where necessary.
- For exported/shared utilities, include a short doc describing inputs, outputs, and purpose.

## Types & type-safety

- Use existing types where possible; check for duplicates before creating new types/interfaces.
- Ask where a missing type/module should live before committing placeholder types.

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
- Suggest PR descriptions that include what changed, why, and how to test.
