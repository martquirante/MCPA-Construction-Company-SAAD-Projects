---
name: systematic-debugging
description: Triggers when troubleshooting build errors, runtime exceptions, API failures, database issues, deployment failures, performance regressions, or UI bugs. Enforces evidence-based root-cause investigation, controlled experiments, and minimal verified fixes over trial-and-error changes.
---

# Systematic Debugging Protocol

## Purpose

Identify and resolve the underlying cause of software failures through reproducible investigation, evidence collection, hypothesis testing, and verification.

Apply this skill when troubleshooting compiler errors, runtime exceptions, failing tests, API requests, database queries, authentication issues, UI behavior, performance problems, and deployment failures.

## Rules

1. **Never Guess**
   - Do not apply speculative code changes without supporting evidence.
   - Do not suppress errors, disable validation, or wrap entire codebases in `try/catch` as a substitute for diagnosis.
   - Distinguish confirmed facts from assumptions and unverified hypotheses.
   - Do not assume that the most recently changed file is necessarily the root cause.

2. **Reproduce the Failure**
   - Determine the exact steps, command, request, or user interaction that triggers the issue.
   - Record the expected behavior and the actual behavior.
   - Capture the complete error message, stack trace, relevant logs, and environment details.
   - Identify whether the issue occurs consistently, intermittently, or only in a particular environment.
   - If the failure cannot be reproduced, gather additional evidence before changing code.

3. **Trace the Execution Flow**
   - Follow the request or operation from its entry point to the point of failure.
   - Inspect relevant function calls, component state, event handlers, middleware, service methods, database operations, and external dependencies.
   - For APIs, inspect request URLs, methods, sanitized headers, payloads, status codes, response bodies, and timing.
   - For databases, inspect query parameters, schema definitions, constraints, transaction boundaries, and migration history.
   - For UI bugs, inspect component state, props, event propagation, rendering conditions, and browser console errors.
   - Locate the earliest confirmed point where actual behavior diverges from expected behavior.

4. **Formulate an Evidence-Based Hypothesis**
   - State the most likely cause and the evidence supporting it.
   - Explain the mechanism behind the failure rather than merely repeating the error message.
   - Consider relevant causes such as race conditions, stale state, incorrect asynchronous handling, missing environment variables, incompatible dependencies, schema mismatches, authorization failures, or network configuration.
   - When multiple explanations remain plausible, rank them and identify the smallest diagnostic test that can distinguish between them.
   - Update or reject the hypothesis when new evidence contradicts it.

5. **Use Controlled Experiments**
   - Change or test one relevant variable at a time whenever practical.
   - Prefer small diagnostic checks over broad refactoring.
   - Compare a failing case with a known-working case when available.
   - Use logs, breakpoints, test assertions, network inspection, and database diagnostics to verify assumptions.
   - Avoid making several unrelated changes simultaneously because doing so obscures the actual cause.

6. **Apply the Minimal Root-Cause Fix**
   - Modify the smallest appropriate section of code or configuration that resolves the confirmed cause.
   - Preserve existing architecture, naming conventions, interfaces, business rules, and working functionality.
   - Avoid unrelated formatting changes, dependency upgrades, architectural rewrites, and broad refactoring.
   - Do not add retries, fallback behavior, silent defaults, or error suppression unless they address a demonstrated requirement.
   - If the root cause is configuration or infrastructure, fix that layer instead of introducing unnecessary application-code workarounds.

7. **Verify the Fix**
   - Reproduce the original failure after applying the change.
   - Run the relevant automated tests, targeted diagnostic commands, or manual verification steps.
   - Confirm that the expected behavior now occurs and that the original error no longer appears.
   - Run relevant regression tests to detect side effects.
   - If verification is blocked or incomplete, clearly state what remains unverified.
   - Never claim a fix works merely because the code was edited.

8. **Handle Errors Properly**
   - Catch exceptions only at appropriate recovery or system boundaries.
   - Preserve useful diagnostic information while presenting safe, actionable errors to users.
   - Never silently swallow exceptions that indicate unexpected failures.
   - Avoid exposing credentials, access tokens, private user data, connection strings, or internal stack traces to end users.
   - Preserve the original exception context when rethrowing or translating errors where the language and framework support it.

9. **Protect Data and Production Systems**
   - Never delete production records, reset production databases, disable security controls, or perform destructive migrations as a debugging shortcut.
   - Prefer local, test, or staging environments and synthetic data.
   - Back up affected data and obtain appropriate authorization before any potentially destructive operation.
   - Redact secrets and personal information from logs and shared diagnostic output.
   - Treat database restoration, failover, and infrastructure changes as controlled operations with explicit verification.

10. **Check Environment and Dependency Differences**
    - Verify runtime versions, package versions, SDK installations, environment variables, permissions, ports, and platform-specific settings when relevant.
    - Inspect dependency compatibility before upgrading or downgrading packages.
    - Check whether behavior differs between development, staging, production, Windows, Android, iOS, or web environments.
    - Do not print secret environment-variable values while checking whether configuration is present.
    - Avoid reinstalling all dependencies or clearing every cache unless evidence points to a cache or dependency-resolution issue.

11. **Debug Asynchronous and Network Failures**
    - Inspect request timing, cancellation, timeout configuration, response status, and retry behavior.
    - Check for race conditions, duplicate requests, stale responses, unhandled futures or promises, and lifecycle-related state updates.
    - Verify CORS, DNS, TLS, proxy, firewall, and port configuration only when relevant to the observed failure.
    - Distinguish frontend failures from backend failures and backend failures from downstream dependency failures.
    - Do not retry non-idempotent operations blindly; duplicate requests can create duplicate records or transactions.

12. **Debug Database and Integration Failures**
    - Verify the active database, connection configuration, schema, permissions, and migration status.
    - Confirm that application queries match the actual database schema and expected data types.
    - Inspect transaction handling, connection pooling, timeouts, and concurrent access when supported by evidence.
    - For Supabase-primary and Neon-recovery architectures, verify the configured replication or backup/restore mechanism rather than assuming synchronization.
    - For Azure Blob Storage backups, verify backup integrity and restoration procedures independently.
    - Do not assume Vercel automatically replaces an unavailable Azure backend unless an actual fallback mechanism is implemented and configured.

13. **Debug UI and Frontend Failures**
    - Inspect browser or device console errors, network requests, component lifecycle, state transitions, and rendered output.
    - Verify loading, success, empty, and error states.
    - Check responsive behavior and platform-specific differences where applicable.
    - Confirm whether the issue originates in frontend state, API data, CSS/layout, browser permissions, or an external dependency before modifying the UI.
    - Avoid arbitrary delays, forced rerenders, or duplicated event handlers as speculative fixes.

14. **Preserve Project Conventions**
    - Inspect the relevant source code, project instructions, existing tests, and architecture before proposing changes.
    - Follow applicable repository-level instructions and installed development skills.
    - Reuse existing abstractions and dependencies where appropriate.
    - Avoid modifying unrelated files or changing public interfaces without justification.
    - Explain any necessary trade-offs or broader changes before implementing them.

## Standard Debugging Workflow

### Phase 1: Understand

1. Read the reported error and reproduce the issue.
2. Identify the affected feature, environment, and expected behavior.
3. Inspect the relevant source code and recent changes when available.
4. Gather logs, traces, request details, or database evidence.

### Phase 2: Diagnose

1. Trace execution to the earliest confirmed failure point.
2. Identify the relevant subsystem and dependency boundaries.
3. Formulate a specific, falsifiable root-cause hypothesis.
4. Perform the smallest diagnostic experiment that can validate or reject it.

### Phase 3: Fix

1. Confirm the cause using evidence.
2. Apply the smallest appropriate code or configuration change.
3. Preserve existing functionality and security controls.
4. Add or update a regression test when practical.

### Phase 4: Verify

1. Repeat the original reproduction steps.
2. Run targeted tests and relevant regression tests.
3. Check logs and observable behavior for remaining errors.
4. Confirm that no unintended side effects were introduced.
5. Report any checks that could not be completed.

## Framework-Specific Diagnostic Guidance

### Flutter and Android
- Inspect Flutter console output, device logs, widget state, asynchronous operations, and platform-channel errors.
- Check `flutter doctor`, SDK configuration, Gradle output, and dependency compatibility when relevant.
- Distinguish Dart exceptions from Android platform errors and build-tool failures.
- Verify runtime permissions and device capabilities before attributing failures to application logic.

### React and Next.js
- Inspect browser console output, server logs, component props/state, hydration errors, and failed network requests.
- Distinguish server-side rendering errors from client-side runtime errors.
- Verify API route behavior, environment configuration, and deployment-specific settings.
- Avoid using client-only APIs in server-rendered code unless correctly isolated.

### ASP.NET Core and Node.js
- Inspect application logs, exception details, middleware order, dependency injection, route matching, and configuration loading.
- Verify request binding, validation, authentication, authorization, and downstream service responses.
- Distinguish application exceptions from reverse-proxy, hosting, and network failures.

### SQL, Supabase, and Neon
- Verify schema definitions, table and column names, constraints, roles, policies, and migration history.
- Inspect database error codes and sanitized query parameters.
- Confirm row-level security behavior and transaction outcomes where applicable.
- Use non-production environments for destructive diagnostics.

## Reporting Requirements

Every debugging report should contain:

- **Observed problem:** What failed and how it was reproduced.
- **Evidence:** Relevant errors, logs, traces, responses, or test results.
- **Root cause:** The confirmed cause, or the leading hypothesis if not yet confirmed.
- **Fix:** The minimal change made or recommended.
- **Verification:** Commands and tests actually executed, including their results.
- **Remaining risks:** Unverified assumptions, blocked checks, and potential side effects.

Use precise status labels:

- **Confirmed:** Supported by direct evidence.
- **Likely:** Supported by evidence but not conclusively verified.
- **Unconfirmed:** Requires further investigation.
- **Verified fix:** The original failure was reproduced, corrected, and successfully retested.
- **Partially verified:** Some checks passed, but full verification remains incomplete.

## Completion Checklist

- [ ] The failure and expected behavior are clearly identified.
- [ ] Relevant logs and diagnostic evidence were inspected.
- [ ] The execution flow was traced to the failure point.
- [ ] The root-cause hypothesis was tested.
- [ ] The fix addresses the underlying cause.
- [ ] Unrelated code and configuration were preserved.
- [ ] Relevant tests and regression checks were executed.
- [ ] Security and data-integrity safeguards were maintained.
- [ ] Actual results and remaining limitations were documented.

Never fabricate diagnostic evidence, root causes, successful fixes, test results, or deployment status.
