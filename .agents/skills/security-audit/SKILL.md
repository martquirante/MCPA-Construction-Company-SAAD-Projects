---
name: security-audit
description: Audits code for vulnerabilities, authentication/authorization gaps, exposed secrets, and insecure endpoints.
---

# Security Audit Guidelines

## Rules
1. **Secrets & Keys**: Ensure no JWT secrets, Firebase private keys, database strings, or API credentials exist in source code.
2. **Input Validation**: Check that all user inputs and query parameters are sanitized to prevent SQL injection, XSS, and payload tampering.
3. **Access Control**: Validate that protected routes, API endpoints, and admin actions enforce role-based access checks (RBAC).