---
name: systematic-debugging
description: Triggers when troubleshooting errors, runtime exceptions, API failures, or UI bugs. Enforces root-cause investigation over trial-and-error fixes.
---

# Systematic Debugging Protocol

## Rules
1. **Never guess**: Do not apply speculative code changes or wrap everything in try/catch without diagnosing.
2. **Trace the flow**: Inspect console traces, network payloads, API responses, or database queries to locate the exact break point.
3. **Formulate a hypothesis**: Clearly state *why* the failure happened (e.g., race condition, undefined state, missing env var, schema mismatch).
4. **Minimal fix**: Propose the cleanest, minimal patch that solves the root problem without side effects.