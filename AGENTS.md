# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Test policy

- Tests must protect observable behavior and data integrity, not the current implementation's shape. Prefer domain-level and interaction outcomes over exact UI copy, element counts, style details, animation settings, or internal API call counts.
- Story dialogue and other editable content must be tested with independent fixtures (`test/fixtures/`), not by asserting the current production text or line count. Do not freeze temporary UI copy, BGM mappings, placeholders, or presentation sequences in tests unless explicitly required by the specification.
- Preserve meaningful coverage of timer accounting, NT rewards and purchases, story access and unlocks, persistence, concurrency, and failure recovery. Do not weaken a genuine user-facing requirement merely to make a test pass.
- Do **not** automatically add a regression test for every bug fix. First check whether an existing test already covers the behavior. Add or extend a test only when it closes a meaningful, otherwise-uncovered risk; prefer adjusting an existing test over adding another. Tests made redundant or obsolete by agreed changes may be removed or updated.
- When tests fail after a legitimate feature or UI change, determine whether the requirement changed or the implementation regressed. Do not revert correct behavior just to satisfy stale assertions, and do not blindly rewrite assertions to make failures disappear.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm test` when dependencies are available; verify native-only behavior (app lifecycle, audio, full-screen presentation) on actual devices.

## Pre-release persistence compatibility

- **Keep the existing schema migrations and migration tests during development.** Do not delete them as part of routine test cleanup.
- **Before the first official public release**, review and remove migrations that only support unpublished development schemas, together with their obsolete migration-only tests. Keep current-state validation and schema versioning.
- **After an official release**, preserve compatibility with previously released persisted data when changing schemas; add migrations and tests where needed. Do not remove supported migrations solely because they are old.
