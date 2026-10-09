---
name: verify-before-answer
description: Verify a repair in the task-summary teaching demo before reporting completion; use after code changes or when a test result is disputed.
---
# Verify this demo repair

1. Read README.md to recover the product rule. Confirm the scope is task-summary, not an arbitrary repository.
2. Run `npm test`. If it fails, report the failing assertion; do not declare completion or weaken assertions.
3. Run `npm run demo`. Compare the JSON against the literal expected result in README.md.
4. Report the changed behavior, observed test counts, sample output, and unverified limits.

This skill is an instruction recipe. It neither creates a /verify tool nor enforces a security boundary.
