---
name: testing
description: Generates automated unit, API, and component tests using TDD principles.
---

# Testing & TDD Principles

## Rules
1. **Test Boundaries**: Cover edge cases (empty strings, null pointers, network timeouts, invalid schema).
2. **Mocking**: Mock external network calls and database transactions to keep unit tests fast and deterministic.
3. **Assertions**: Test business outcomes and rendered state rather than internal implementation details.