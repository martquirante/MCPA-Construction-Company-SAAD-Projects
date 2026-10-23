---
name: testing
description: Generates reliable automated unit, API, integration, database, UI/component, and end-to-end tests using Test-Driven Development (TDD), with coverage for security, failure scenarios, recovery workflows, and deployment readiness.
---

# Testing & TDD Principles

## Purpose

Use this skill to plan, write, execute, debug, and maintain automated tests for application features, APIs, databases, frontend components, backend services, and deployment workflows.

Prioritize meaningful tests that verify observable behavior, business requirements, data integrity, security, and resilience rather than simply maximizing code coverage.

## Rules

1. **Test Boundaries and Edge Cases**
   - Test empty strings, whitespace, null values, missing fields, invalid types, malformed JSON, unexpected inputs, and boundary values.
   - Test invalid authentication, expired sessions, insufficient permissions, duplicate records, and invalid state transitions.
   - Test network timeouts, connection failures, rate limits, retries, and unavailable dependencies.
   - Verify correct behavior when data is missing, incomplete, stale, or inconsistent.

2. **Mock External Dependencies**
   - Mock external network calls, third-party APIs, email services, payment gateways, and other services during unit tests.
   - Isolate database transactions when testing business logic.
   - Use test databases or disposable environments for integration tests.
   - Do not mock the exact behavior a test is intended to verify. Database integration tests must exercise a real compatible database where practical.

3. **Assert Business Outcomes**
   - Verify returned values, persisted data, HTTP status codes, rendered UI states, user-visible errors, and permitted side effects.
   - Avoid assertions that depend unnecessarily on private methods, internal implementation details, or brittle DOM structure.
   - Ensure tests fail when the expected business behavior is broken.

4. **Follow Test-Driven Development (TDD)**
   - Write a failing test for the intended behavior.
   - Implement the smallest change necessary to pass.
   - Refactor while keeping tests passing.
   - Run relevant regression tests after changes.
   - Do not claim TDD was followed unless the red-green-refactor process was actually performed.

5. **Test Security and Authorization**
   - Verify authentication, authorization, role-based access, ownership checks, input validation, and session handling.
   - Test direct API requests that attempt to bypass frontend restrictions.
   - Confirm that secrets, passwords, tokens, and sensitive records are not exposed in responses or logs.
   - Test SQL injection, cross-site scripting (XSS), insecure file access, and other relevant risks using safe test inputs.

6. **Test Database Integrity**
   - Verify schema constraints, foreign keys, unique constraints, transactions, rollback behavior, and migration correctness.
   - Test duplicate submissions, concurrent updates, missing related records, and partial failures.
   - Ensure failed operations do not leave inconsistent or partially committed data.
   - Use isolated test databases and synthetic data. Never run destructive tests against production data.

7. **Test API Contracts**
   - Validate request schemas, response schemas, status codes, headers, authentication, pagination, filtering, and error formats.
   - Cover successful requests and expected client and server errors.
   - Test timeouts, retries, idempotency, rate limiting, and dependency failures where applicable.
   - Confirm backward compatibility when modifying existing endpoints.

8. **Test UI and Components**
   - Verify initial, loading, success, empty, error, and disabled states where applicable.
   - Test form validation, keyboard interactions, accessible labels, responsive layouts, and user actions.
   - Ensure loading indicators and error messages behave correctly during slow or failed requests.
   - Prefer accessible queries and user interactions over implementation-specific selectors.

9. **Test Integration and End-to-End Workflows**
   - Verify critical user journeys across the frontend, backend, authentication, and database.
   - Cover realistic workflows, including record creation, updates, deletion, status transitions, and permission restrictions.
   - Use deterministic test fixtures and clean up test data.
   - Keep end-to-end tests focused on important workflows; use unit and integration tests for broader edge-case coverage.

10. **Test Reliability and Repeatability**
    - Avoid arbitrary sleeps, shared mutable test state, test-order dependencies, and reliance on production services.
    - Control clocks, randomness, and generated identifiers when they affect expected outcomes.
    - Ensure tests can run repeatedly and independently.
    - Investigate flaky tests instead of repeatedly rerunning them until they pass.

11. **Test Backup, Recovery, and Failover**
    - Where the application architecture requires it, verify backup creation, restoration, data consistency, and recovery procedures.
    - For a Supabase-primary and Neon-recovery architecture, test the explicitly configured replication or backup/restore workflow.
    - Verify that Azure Blob Storage backups can be retrieved and restored in an isolated environment.
    - Test failure detection, controlled failover, application reconnection, and failback where supported.
    - Never assume Supabase and Neon are synchronized or that Vercel automatically acts as an Azure backend fallback. Test only the mechanisms that have actually been configured.
    - Never test failover by disrupting production services without an approved plan.

12. **Test Deployment and Environment Configuration**
    - Run linting, type checking, build validation, migrations, and automated tests in CI where supported.
    - Validate required environment variables without exposing their values.
    - Verify health endpoints, startup behavior, database connectivity, and dependency readiness.
    - Keep development, testing, staging, and production configurations separate.
    - Do not deploy automatically merely because local tests pass; follow the project's deployment and approval requirements.

13. **Measure Coverage Meaningfully**
    - Prioritize critical business logic, authorization, data integrity, error handling, and recovery paths.
    - Use coverage reports to identify untested code, not as the sole indicator of quality.
    - Set coverage thresholds according to project requirements rather than inventing universal percentages.
    - Do not claim code coverage or test results without actually running the relevant tools.

14. **Preserve Existing Project Conventions**
    - Inspect the project's existing framework, test runner, directory structure, naming conventions, fixtures, and CI pipeline before adding tests.
    - Reuse existing dependencies and helpers when appropriate.
    - Avoid installing unnecessary packages or rewriting unrelated code.
    - If no testing framework exists, recommend the smallest suitable setup for the project's stack.

## Recommended Testing Layers

### Unit Tests
Test individual functions, utilities, validators, and business rules in isolation.

### API Tests
Test endpoint contracts, validation, authentication, authorization, status codes, and error handling.

### Integration Tests
Test interactions between services, repositories, database operations, and external dependency adapters.

### UI and Component Tests
Test rendered states, accessibility, validation, and user interactions.

### End-to-End Tests
Test high-value user workflows through the application as a real user would experience them.

### Recovery and Resilience Tests
Test configured backup, restore, reconnection, and failover procedures in isolated environments.

## Standard Workflow

1. Inspect the relevant source code and existing tests.
2. Identify expected behavior, critical risks, and acceptance criteria.
3. Choose the appropriate testing layers.
4. Create deterministic fixtures and isolate external dependencies.
5. Write tests for normal behavior, edge cases, and failure scenarios.
6. Run the tests and inspect failures.
7. Implement or correct the application code.
8. Rerun targeted tests and relevant regression suites.
9. Run linting, type checks, and build validation when available.
10. Report the exact commands executed, actual results, remaining failures, and known limitations.

## Completion Checklist

- [ ] Core business behavior is covered.
- [ ] Edge cases and validation failures are tested.
- [ ] Authentication and authorization are verified where relevant.
- [ ] Database integrity and rollback behavior are checked.
- [ ] External dependencies are isolated appropriately.
- [ ] UI loading, empty, success, and error states are covered where applicable.
- [ ] Critical integration and end-to-end workflows pass.
- [ ] Relevant regression tests pass.
- [ ] Linting, type checking, and build checks are reported accurately.
- [ ] Backup and recovery tests are included when required by the architecture.
- [ ] No production data or secrets were exposed during testing.
- [ ] All results and outstanding limitations are documented.

## Reporting Requirements

Always distinguish between:
- **Passed:** The test was executed and passed.
- **Failed:** The test was executed and failed.
- **Blocked:** The test could not run because of a missing dependency, environment, permission, or configuration.
- **Not run:** The test has not been executed.
- **Not applicable:** The test does not apply to the feature or project.

Never fabricate test execution, coverage percentages, successful deployments, recovery results, or security verification.
