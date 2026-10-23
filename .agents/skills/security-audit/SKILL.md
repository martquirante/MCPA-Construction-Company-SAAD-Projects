---
name: security-audit
description: Performs security reviews of source code, APIs, authentication and authorization, databases, cloud configuration, dependencies, and deployment infrastructure. Identifies, validates, prioritizes, and remediates security vulnerabilities using secure coding practices, OWASP guidance, and relevant security tooling. Triggers before security-sensitive releases, when reviewing code changes, when investigating suspicious behavior, and when auditing existing applications.
---

# Security Audit & Secure Coding Standards

## 1. Mission

Act as a security-focused software engineer conducting a practical, evidence-based security audit.

The objective is to identify genuine vulnerabilities, explain their impact, recommend safe fixes, and verify remediation without unnecessarily breaking existing functionality.

Audit the complete relevant attack surface, including:

- Frontend and client-side code.
- Backend services and API endpoints.
- Authentication and session management.
- Authorization and role-based access control.
- Database queries, permissions, and policies.
- Firebase and Supabase configurations.
- File uploads and file processing.
- External integrations and webhooks.
- Secrets and environment configuration.
- Dependencies and supply-chain risks.
- Cloud infrastructure and deployment pipelines.
- Logging, monitoring, and error handling.
- Tests and security regression coverage.

**Core principle:** Do not assume an application is secure because it compiles, its UI hides sensitive actions, or its endpoints require a logged-in user.

Security controls must be enforced at the appropriate trusted boundary and verified against the actual implementation.

---

## 2. Mandatory Audit Workflow

### Step 1 — Understand the application

Before changing code, identify:

- The application architecture and technology stack.
- The application's main users and trust boundaries.
- Public and protected routes.
- Authentication providers and session mechanisms.
- User roles and permission requirements.
- Backend APIs and database access paths.
- External services and integrations.
- Deployment environments and secret-management mechanisms.
- Sensitive data handled by the application.
- Existing security controls and tests.

Inspect relevant files, configuration, schemas, middleware, routes, and dependencies.

Do not assume that an unfamiliar file, endpoint, database policy, or environment variable is safe or unsafe without inspecting the available evidence.

### Step 2 — Map the attack surface

Identify all relevant entry points:

- Public API endpoints.
- Authenticated endpoints.
- Administrative endpoints.
- File uploads and downloads.
- Search, filtering, sorting, and pagination parameters.
- Query parameters and request bodies.
- Authentication callbacks.
- Password-reset and account-recovery flows.
- Webhooks and background jobs.
- Database policies and direct client access.
- Third-party integrations.
- Deployment workflows and environment configuration.

Trace sensitive operations from the initial request to the final data access or state change.

### Step 3 — Identify vulnerabilities

Review the code and configuration against relevant security standards and known vulnerability classes.

Prioritize issues that could expose data, bypass permissions, compromise accounts, alter important records, or compromise infrastructure.

### Step 4 — Validate findings

For each suspected vulnerability:

1. Identify the exact affected code or configuration.
2. Explain the trust boundary and missing security control.
3. Determine the realistic attack prerequisites.
4. Assess whether the vulnerability is demonstrable from available evidence.
5. Identify the potential impact.
6. Recommend the smallest appropriate fix.
7. Define how to verify the fix.

Distinguish confirmed vulnerabilities from potential risks, suspicious patterns, and informational observations.

Do not report speculative findings as confirmed vulnerabilities.

### Step 5 — Remediate safely

When implementation changes are authorized:

- Fix the underlying cause rather than merely hiding the symptom.
- Preserve legitimate application behavior.
- Follow the existing architecture.
- Add regression tests where appropriate.
- Avoid unrelated refactoring.
- Never disable security controls just to make a test pass.
- Never claim remediation is complete without appropriate verification.

If the user requests an audit or report only, do not modify files unless authorized.

---

## 3. Secrets, Credentials, and Sensitive Information

Search for accidentally exposed:

- API keys.
- JWT signing secrets.
- Database credentials and connection strings.
- Firebase service-account private keys.
- Cloud provider credentials.
- OAuth client secrets.
- Private certificates and signing keys.
- SMTP credentials.
- Webhook secrets.
- Hardcoded passwords.
- Tokens embedded in scripts, source maps, configuration, or logs.
- Credentials committed to repository history.

### Environment configuration

- Store server-side secrets in an appropriate secret manager or protected environment configuration.
- Never place private credentials in frontend bundles.
- Follow the framework's public/private environment-variable conventions.
- Treat values exposed through public client-side prefixes as public.
- Do not assume that a variable is secret merely because it is defined in an environment file.
- Avoid printing credentials during debugging or CI/CD.
- Check whether sensitive values are exposed through error messages, source maps, logs, or generated artifacts.
- Ensure local secret files are appropriately excluded from version control.

### Important distinctions

A publishable or anonymous client key is not automatically a vulnerability. Its safety depends on the provider's intended usage, associated permissions, database policies, and surrounding controls.

For Firebase and Supabase, evaluate actual authorization rules rather than treating the presence of a client-side project key as proof of compromise.

### If a secret is exposed

1. Determine the likely exposure and affected services.
2. Recommend revoking or rotating the credential.
3. Identify dependent applications and integrations that may need updating.
4. Check relevant repository history and deployment artifacts.
5. Recommend removing the exposed value from source control when appropriate.
6. Verify that the replacement credential is not exposed.

Deleting a secret from the latest commit does not necessarily remove it from Git history or previously deployed artifacts.

Never reproduce complete sensitive credentials in the audit report. Redact them.

---

## 4. Authentication and Session Management

Review authentication implementation and account lifecycle flows.

Check for:

- Missing authentication on protected operations.
- Incorrect JWT verification.
- Acceptance of unsigned, expired, or improperly validated tokens.
- Incorrect issuer, audience, or signature validation.
- Trusting user-supplied role claims without appropriate verification.
- Insecure session storage.
- Session fixation.
- Improper session expiration or invalidation.
- Weak password-reset flows.
- Account enumeration risks.
- Insecure OAuth callbacks.
- Missing CSRF protections where applicable.
- Insecure remember-me implementations.
- Missing rate limiting on sensitive authentication endpoints.
- Incorrect handling of expired or revoked sessions.

### Authentication requirements

- Validate identity on the trusted server or through a properly configured identity provider.
- Validate tokens using the provider's supported verification mechanism.
- Verify relevant issuer, audience, expiry, and signature requirements.
- Never trust a decoded JWT payload without verifying the token.
- Enforce secure password storage through established password-hashing mechanisms.
- Use secure cookie attributes where cookie-based sessions are appropriate.
- Rotate or invalidate sessions after sensitive account changes when required.
- Implement appropriate account-recovery controls.
- Use MFA or stronger authentication for sensitive operations when justified by risk.

Do not replace a correctly implemented authentication provider with a custom implementation without a clear, justified requirement.

---

## 5. Authorization and Access Control

Authentication answers who the user is. Authorization determines what that user is permitted to do.

Audit authorization separately from authentication.

### Role-based access control

Verify that:

- Every protected operation checks the required permission.
- Administrative operations enforce server-side authorization.
- User roles are obtained from a trusted source.
- Permission checks cannot be bypassed by changing client-side state.
- Privileged operations require the appropriate level of access.
- Default access is denied when no valid permission is established.
- Permission changes take effect correctly.
- Role changes cannot be self-assigned through ordinary profile updates.

### Object-level authorization

Test for IDOR/BOLA vulnerabilities, including unauthorized access through modified:

- User IDs.
- Project IDs.
- Booking IDs.
- Invoice IDs.
- Contract IDs.
- Document IDs.
- Tenant or organization IDs.
- Record identifiers in request bodies or query parameters.

A valid session does not grant access to every record.

For every sensitive resource, verify that the requesting principal is authorized to access the specific object and perform the requested action.

### Multi-tenant applications

Verify that tenant isolation is enforced at the server and database layers where applicable.

Ensure that users from one organization cannot read, update, delete, or infer another organization's private records by changing an identifier.

Do not rely exclusively on frontend filtering or tenant IDs supplied by the client.

---

## 6. Input Validation and Injection Prevention

Treat all external input as untrusted, including input from authenticated users and third-party services.

Inspect:

- Request bodies.
- Query parameters.
- Route parameters.
- HTTP headers.
- Cookies.
- File names and uploaded file contents.
- Webhook payloads.
- Imported data.
- Database values that may contain previously untrusted input.

### SQL and database injection

- Use parameterized queries or the database driver's safe query interface.
- Avoid constructing SQL statements through string concatenation.
- Validate dynamic table names, column names, sort directions, and other SQL identifiers using explicit allowlists where parameterization is not available.
- Apply least-privilege database permissions.
- Review ORM raw-query usage carefully.
- Test edge cases and malformed input.

### Other injection risks

Review for:

- Cross-site scripting (XSS).
- NoSQL injection.
- Operating-system command injection.
- Server-side template injection.
- LDAP injection.
- XML external entity (XXE) vulnerabilities.
- Unsafe deserialization.
- Path traversal.
- Header injection.
- Server-side request forgery (SSRF).
- Expression or query-language injection.

### Validation principles

- Validate data types, lengths, formats, ranges, and allowed values.
- Reject unexpected structures where strict schemas are appropriate.
- Normalize data only when the application semantics require it.
- Encode output appropriately for its destination.
- Avoid treating input sanitization as a universal replacement for contextual output encoding or parameterized queries.
- Apply validation on the server even if the frontend already validates the same field.

---

## 7. API and Backend Security

Review every relevant endpoint and its middleware.

Check for:

- Missing authentication or authorization.
- Inconsistent permission enforcement between endpoints.
- Excessive data exposure.
- Mass assignment.
- Unsafe object updates.
- Unrestricted administrative actions.
- Missing request-size limits.
- Unbounded pagination or expensive queries.
- Missing rate limiting where abuse could cause harm.
- Insecure CORS configuration.
- Missing CSRF defenses where required.
- Improper HTTP method handling.
- Verbose internal error messages.
- Unsafe redirect destinations.
- SSRF through user-controlled URLs.
- Weak webhook verification.
- Missing idempotency protection for sensitive retryable operations.
- Unrestricted file access.
- Insecure caching of private responses.
- Incorrect security-header configuration.

### API requirements

- Enforce authorization on the server.
- Validate request schemas.
- Return only the data the caller is permitted to receive.
- Use appropriate HTTP status codes.
- Avoid leaking stack traces or internal infrastructure details.
- Apply limits to expensive or potentially abusive operations.
- Verify webhook signatures using the provider's documented method.
- Enforce HTTPS in production environments.
- Apply CORS allowlists appropriate to the application's requirements.
- Treat CORS as a browser policy, not an authentication or authorization mechanism.

Do not add arbitrary security headers, rate limits, or CORS restrictions without considering legitimate application behavior and deployment architecture.

---

## 8. Frontend Security

Review browser-facing code for:

- Hardcoded secrets.
- DOM-based XSS.
- Unsafe HTML rendering.
- Dangerous use of `innerHTML` or equivalent APIs.
- Unsafe URL construction.
- Open redirects.
- Sensitive information in browser storage.
- Sensitive data exposed in URLs.
- Insecure postMessage handling.
- Missing origin validation.
- Clickjacking risks.
- Insecure authentication redirects.
- Dependency risks.
- Accidental leakage through client-side logs.

### Frontend rules

- Do not rely on hiding a button to enforce permissions.
- Do not trust client-side roles or permission flags.
- Avoid unsafe HTML rendering; sanitize untrusted HTML with an appropriate, maintained sanitizer when HTML rendering is necessary.
- Validate message origins and expected message structures.
- Avoid placing secrets or sensitive tokens in local storage when safer supported session mechanisms are available.
- Do not log credentials or private user data.
- Use a Content Security Policy appropriate to the application where feasible.
- Avoid unsafe inline script policies unless there is a well-understood, justified requirement.

A frontend security control can improve user experience, but it does not replace server-side enforcement.

---

## 9. Firebase and Supabase Security

These platforms require special attention because client applications can communicate with backend services directly.

### Firebase

Review:

- Firestore security rules.
- Realtime Database rules.
- Cloud Storage rules.
- Firebase Authentication configuration.
- Custom claims and role enforcement.
- Cloud Functions authorization.
- Service-account handling.
- App Check configuration where appropriate.
- Rules that allow unrestricted reads or writes.
- User ownership and tenant isolation.
- Development rules accidentally used in production.

Do not assume that a Firebase client configuration is a private credential. Focus on exposed privileged credentials and the actual rules protecting the resources.

### Supabase

Review:

- Row Level Security (RLS) on exposed tables.
- Policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Ownership and tenant-isolation conditions.
- Security-definer functions and their execution permissions.
- Grants and database roles.
- Storage bucket policies.
- Edge Function authorization.
- Authentication and JWT verification.
- Service-role key exposure.
- Direct client access to sensitive tables.
- Views and functions that may bypass intended restrictions.
- Migration changes that disable or weaken existing policies.

Verify that RLS is enabled where required and that policies enforce the intended access model. Merely enabling RLS is insufficient if the policies are overly permissive.

Never place Supabase service-role keys or equivalent privileged credentials in browser-accessible code.

### Database backup and recovery security

- Restrict access to backup files and database exports.
- Protect encryption keys and credentials.
- Review backup storage permissions.
- Avoid public backup URLs.
- Check retention and deletion requirements.
- Ensure recovery procedures do not restore insecure permissions or expose production data.

Use official provider documentation and safe test environments when evaluating security rules.

---

## 10. Database Security and Data Integrity

Review database schemas, migrations, queries, stored procedures, functions, and access policies.

Check for:

- Overly privileged database roles.
- Missing ownership restrictions.
- Unsafe dynamic SQL.
- Missing constraints that allow invalid or inconsistent data.
- Sensitive information returned unnecessarily.
- Insecure stored procedures.
- Privilege escalation through database functions.
- Cross-tenant data access.
- Unprotected destructive operations.
- Unsafe migration defaults.
- Excessive exposure of internal identifiers or sensitive fields.

### Database requirements

- Apply least privilege.
- Parameterize database queries.
- Use appropriate constraints and transactions.
- Enforce sensitive invariants at the trusted server or database layer.
- Avoid returning unnecessary private fields.
- Protect migrations and production database credentials.
- Review whether views and stored functions respect the intended access model.
- Ensure destructive operations require the appropriate authorization.

Do not make destructive database changes during an audit without explicit authorization and a safe recovery plan.

---

## 11. File Uploads and Downloads

Review file-handling workflows for:

- Missing authentication or authorization.
- Unsafe file-type assumptions.
- MIME-type trust without content validation.
- Path traversal.
- Malicious or malformed file contents.
- Oversized uploads.
- Archive extraction vulnerabilities.
- Unsafe file names.
- Publicly accessible private files.
- Predictable download URLs.
- Executable uploads stored in public locations.
- Missing retention or cleanup controls.

Where appropriate:

- Apply file-size and request limits.
- Validate permitted formats.
- Inspect file contents using suitable controls.
- Generate server-controlled storage names.
- Store private files outside public executable paths.
- Enforce object-level authorization on downloads.
- Use expiring signed URLs when suitable.
- Consider malware scanning for relevant upload workflows.

Do not assume that a file is safe because its extension or browser-provided MIME type appears valid.

---

## 12. Dependencies and Software Supply Chain

Review direct and transitive dependencies, lockfiles, build tools, and CI/CD configuration.

Look for:

- Known vulnerable package versions.
- Abandoned or suspicious dependencies.
- Typosquatting risks.
- Unexpected install scripts.
- Unpinned or uncontrolled dependency updates.
- Exposed deployment credentials.
- Untrusted GitHub Actions or CI plugins.
- Unsafe build-time scripts.
- Dependency confusion risks.
- Insecure container images or base images where applicable.

Use available tools such as:

- `npm audit` for applicable npm projects.
- `pnpm audit` for applicable pnpm projects.
- `pip-audit` for Python dependencies where available.
- `osv-scanner` for supported dependency ecosystems.
- GitHub Dependabot alerts and dependency review.
- Semgrep for supported static analysis rules.
- CodeQL for supported code-analysis workflows.

Check the package manager and available tooling before executing commands.

### Dependency remediation rules

- Confirm that a reported vulnerability affects the project's dependency and usage.
- Prefer compatible patched versions.
- Review breaking changes before major upgrades.
- Avoid indiscriminately upgrading every dependency during a focused security fix.
- Preserve and update lockfiles appropriately.
- Re-run relevant tests after updates.
- Report advisories that remain unresolved.

A clean dependency scan does not prove the application is secure.

---

## 13. Cloud Infrastructure and Deployment Security

Review application hosting, deployment configuration, infrastructure definitions, and CI/CD workflows.

Check for:

- Publicly exposed databases or storage.
- Overly broad cloud permissions.
- Unprotected deployment workflows.
- Secrets in repository files or build logs.
- Incorrect environment separation.
- Missing production protections.
- Unrestricted network access.
- Insecure HTTP endpoints.
- Misconfigured CORS or security headers.
- Untrusted deployment artifacts.
- Overly privileged service identities.
- Unsafe container configuration.
- Unprotected backup files.
- Insufficient audit logging.

### Deployment requirements

- Separate development, testing, and production secrets.
- Use least-privilege identities and access policies.
- Prefer managed identity or workload identity federation where supported.
- Protect production deployment permissions.
- Avoid printing secrets during builds.
- Review pull-request workflows that execute untrusted code.
- Pin third-party CI actions or dependencies appropriately for the risk.
- Protect database migrations and rollback procedures.
- Ensure logs do not expose credentials or sensitive payloads.
- Verify that security settings are applied in the actual deployment environment.

For Azure, Vercel, Supabase, Neon, or other providers, consult the applicable official documentation and existing project configuration before recommending provider-specific changes.

---

## 14. Logging, Monitoring, and Error Handling

Review whether security-relevant events can be detected without exposing sensitive data.

Consider logging:

- Authentication failures.
- Authorization failures.
- Privilege changes.
- Sensitive administrative operations.
- Suspicious access patterns.
- Important configuration changes.
- Security-relevant failures.

Avoid logging:

- Passwords.
- Access tokens.
- Refresh tokens.
- Full private credentials.
- Unnecessary sensitive personal information.
- Unredacted request bodies containing secrets.

Ensure logs are protected from unauthorized access and tampering where appropriate.

Return useful client-facing errors without revealing stack traces, internal paths, SQL details, secret values, or infrastructure internals.

Do not suppress all security-relevant errors merely to make logs appear clean.

---

## 15. Cryptography and Sensitive Data

Review cryptographic usage for:

- Weak or obsolete algorithms.
- Hardcoded encryption keys.
- Incorrect random-number generation.
- Unsafe password storage.
- Improper JWT signing and verification.
- Reused nonces or initialization vectors where prohibited.
- Insecure certificate validation.
- Poor key rotation practices.
- Plaintext storage of sensitive information.
- Inadequate transport security.

Use maintained platform libraries and established cryptographic protocols.

Do not invent custom encryption algorithms or roll your own password-hashing scheme.

Select controls according to the data's sensitivity, threat model, and applicable requirements.

---

## 16. Security Testing and Tooling

Use available security tools to support—not replace—manual analysis.

### Static analysis

Inspect source code using appropriate tools, such as:

- Semgrep.
- CodeQL.
- ESLint security-related rules where relevant.
- Language-specific static analyzers.

### Dependency analysis

Use:

- Package-manager audit commands.
- Dependabot.
- OSV-Scanner.
- Other appropriate software composition analysis tools.

### Dynamic and integration testing

Where appropriate and authorized, test:

- Authentication enforcement.
- Object-level authorization.
- Role restrictions.
- Input validation.
- Session expiration.
- Error handling.
- Rate limiting.
- Database access policies.
- File access permissions.
- Security headers.

### Test environment rules

- Prefer local, staging, or explicitly authorized test environments.
- Use synthetic accounts and non-sensitive test data.
- Do not perform destructive tests against production without explicit authorization and a recovery plan.
- Do not conduct denial-of-service testing, aggressive fuzzing, or intrusive scanning without clear authorization and suitable safeguards.
- Do not access unrelated users' private data.
- Stop if testing risks disrupting a real service.

A security scanner finding must be reviewed for context and exploitability before it is classified as confirmed.

---

## 17. Vulnerability Severity and Reporting

Assign severity according to realistic exploitability and impact.

### Critical

A severe, practical vulnerability that could cause major compromise, such as widespread sensitive-data exposure, remote compromise, or highly privileged access without meaningful barriers.

### High

A vulnerability that could cause significant data exposure, privilege escalation, account compromise, or serious unauthorized actions.

### Medium

A vulnerability with meaningful but more constrained impact, additional prerequisites, or limited exposure.

### Low

A limited-impact weakness or defense-in-depth issue with restricted practical consequences.

### Informational

A security improvement, hardening recommendation, or observation without a demonstrated vulnerability.

Use CVSS or an appropriate organizational risk methodology when sufficient information is available. Do not invent a precise CVSS score without assessing the relevant factors.

### Required finding format

For each substantive finding, provide:

**Title:** Short and specific vulnerability name.

**Severity:** Critical, High, Medium, Low, or Informational.

**Status:** Confirmed, Potential, or Not Reproduced.

**Affected location:** File path, relevant line numbers, endpoint, policy, or configuration.

**Evidence:** The specific code behavior or configuration supporting the finding. Redact sensitive values.

**Impact:** What an attacker could realistically access, change, or disrupt.

**Prerequisites:** Required permissions, account access, configuration, or other conditions.

**Recommended fix:** A concrete remediation that addresses the root cause.

**Verification:** A test or inspection that demonstrates the fix.

Avoid vague findings such as "security is weak" without evidence and actionable recommendations.

Do not report the same underlying vulnerability repeatedly as separate findings unless the affected contexts require independent fixes.

---

## 18. Remediation and Regression Prevention

When fixing vulnerabilities:

1. Identify the root cause.
2. Determine which code paths and components are affected.
3. Implement the smallest complete fix.
4. Preserve legitimate business behavior.
5. Add or update security regression tests.
6. Run relevant tests and static analysis.
7. Review adjacent code for the same vulnerability pattern.
8. Document any remaining limitations.

Examples:

- Fix authorization in the backend, not only in the frontend.
- Replace unsafe SQL construction with parameterized queries.
- Correct database policies rather than merely hiding data in the UI.
- Rotate exposed credentials rather than only deleting them from a source file.
- Correct unsafe HTML rendering rather than relying solely on input filtering.
- Fix insecure dependency versions without unnecessarily replacing the application's framework.

Do not weaken permissions, remove validation, disable security middleware, or skip tests to achieve a superficially successful build.

---

## 19. Safe Audit Boundaries

Only inspect systems, repositories, accounts, and environments the user owns or is authorized to assess.

- Do not access unrelated private data.
- Do not expose credentials in the report.
- Do not make destructive changes without explicit authorization.
- Do not alter production permissions or rotate production credentials without authorization.
- Do not run intrusive tests against external services without permission.
- Do not claim to have exploited or verified a vulnerability when only source-code inspection was performed.
- Do not claim that a tool ran if it was unavailable or not executed.
- Do not claim that an application is completely secure.

For suspected active compromise, prioritize containment, credential rotation, evidence preservation, and appropriate incident-response procedures rather than continuing ordinary feature work.

---

## 20. Recommended Security Repositories

Use reputable, relevant references. Inspect the current documentation, repository state, license, and applicability before adopting a tool or copying code.

### A. OWASP security standards and guidance

**1. OWASP Cheat Sheet Series**

https://github.com/OWASP/CheatSheetSeries

Official project containing practical application-security guidance for authentication, authorization, injection prevention, secrets, file uploads, REST APIs, JavaScript, and many other topics.

Use it as a primary reference for concrete remediation guidance.

**2. OWASP Application Security Verification Standard (ASVS)**

https://github.com/OWASP/ASVS

Use ASVS as a structured checklist for evaluating application security requirements and identifying gaps in security controls.

Prefer a stable published release for repeatable audits. Distinguish stable requirements from work-in-progress changes.

**3. OWASP Web Security Testing Guide**

https://github.com/OWASP/wstg

Use it for structured web-application security testing methodology, including authentication, authorization, input validation, session management, and configuration testing.

**4. OWASP Juice Shop**

https://github.com/juice-shop/juice-shop

Use this intentionally vulnerable training application to understand and practice common web security vulnerabilities in a controlled environment.

Do not deploy an intentionally vulnerable training configuration as a production application.

### B. Static analysis and vulnerability detection

**5. Semgrep**

https://github.com/semgrep/semgrep

Use for pattern-based static analysis, security rules, and detection of potentially dangerous code patterns across supported languages.

**6. CodeQL**

https://github.com/github/codeql

Use for code analysis, data-flow investigation, and identifying supported vulnerability patterns in supported languages and workflows.

**7. Trail of Bits — Security Skills**

https://github.com/trailofbits/skills

Use relevant skills as references for security research, vulnerability analysis, and structured audit workflows. Verify the applicable skill and tool requirements before adoption.

**8. OSV-Scanner**

https://github.com/google/osv-scanner

Use for dependency vulnerability scanning and supported software composition analysis workflows.

### C. Dependency and repository security

**9. Dependabot Core**

https://github.com/dependabot/dependabot-core

Use as a reference for dependency-update and vulnerability-remediation workflows. GitHub-hosted Dependabot features may be configured separately from this repository.

**10. GitHub Security Lab**

https://github.com/GitHubSecurityLab

Use its security research, CodeQL examples, and relevant repositories to understand vulnerability patterns and code-analysis techniques.

### Repository usage rules

- Prefer official standards and documentation for security decisions.
- Use the tool most appropriate to the application's language and architecture.
- Do not install every repository or scanner automatically.
- Review installation scripts and permissions before executing them.
- Do not copy exploit code into production systems.
- Do not blindly accept automated findings.
- Keep tool versions and security rules reasonably current.
- Distinguish a tool's capabilities from the coverage actually achieved in the audit.

---

## 21. Audit Completion Checklist

Before reporting completion, verify the applicable items:

- [ ] Relevant source code and configuration inspected.
- [ ] Secrets and credential exposure reviewed.
- [ ] Authentication and session handling reviewed.
- [ ] Server-side authorization and object ownership reviewed.
- [ ] Input validation and injection risks reviewed.
- [ ] API endpoints and sensitive operations reviewed.
- [ ] Frontend security reviewed.
- [ ] Database permissions and policies reviewed.
- [ ] Firebase or Supabase controls reviewed when applicable.
- [ ] Dependencies and build configuration reviewed.
- [ ] Deployment and environment configuration reviewed.
- [ ] File-handling workflows reviewed when applicable.
- [ ] Findings prioritized by realistic risk.
- [ ] Recommended fixes are actionable.
- [ ] Relevant regression tests executed when possible.
- [ ] Unverified areas and limitations documented.
- [ ] No secrets or sensitive personal data exposed in the report.

Not every checklist item applies to every project. Mark items as Not Applicable when justified and Not Verified when the evidence or access is insufficient.

---

## 22. Final Reporting Format

Conclude the audit with:

### Executive summary
Describe the scope, major risks, and overall security posture based on the evidence available.

### Findings
List vulnerabilities by severity, with evidence, impact, and remediation steps.

### Fixes applied
List the files and controls changed, if modifications were authorized.

### Verification performed
List actual tests, scans, commands, and inspections completed, including their results.

### Remaining risks
Describe unresolved findings, unverified areas, environment dependencies, and recommended next steps.

### Important limitations
Clearly state whether the work consisted of source-code review, automated scanning, manual testing, or authorized dynamic testing.

**Final rule:** Report what the evidence supports. A successful build, a clean scanner result, or the absence of obvious vulnerabilities does not establish that an application is secure.