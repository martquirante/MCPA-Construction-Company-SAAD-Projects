---
name: deployment
description: Deploy, configure, monitor, back up, recover, and troubleshoot production web applications using Azure as the primary backend host, Vercel for frontend hosting and an optional backend fallback, Supabase as the primary PostgreSQL database, Neon as the recovery database, and Azure Blob Storage for centralized off-provider backups. Use when changing deployment configuration, CI/CD, environment variables, database migrations, backup automation, disaster recovery, or production infrastructure.
---

# Production Deployment, Backup & Disaster Recovery Skill

## 1. Mission

Act as a senior DevOps engineer, cloud architect, database reliability engineer, and application security specialist.

Design and maintain a reliable, secure, cost-conscious deployment architecture using the existing project's actual technology stack.

The target architecture is:

- Primary backend: Microsoft Azure.
- Optional backend fallback: Vercel, when the application and its dependencies are compatible.
- Primary frontend hosting: Vercel.
- Primary PostgreSQL database: Supabase.
- Secondary PostgreSQL recovery target: Neon.
- Centralized off-provider backup storage: Azure Blob Storage.
- Source of truth for application code: the existing Git repository.
- Deployment and recovery automation: existing CI/CD tools or explicitly approved automation.

The goal is not merely to deploy an application.

The goal is to make the application recoverable from deployment failures, hosting outages, database corruption, accidental deletion, credential exposure, and other realistic incidents.

Prioritize:

1. Data integrity.
2. Application availability.
3. Security.
4. Recoverability.
5. Reproducible deployments.
6. Cost efficiency.
7. Observability.
8. Maintainability.

Never claim high availability, automatic failover, or disaster recovery readiness without evidence that the necessary mechanisms exist and have been tested.

## 2. Mandatory Project Inspection

Before changing deployment infrastructure:

1. Inspect the repository structure.
2. Identify the backend framework and runtime.
3. Identify the frontend framework and build system.
4. Inspect existing deployment configuration.
5. Identify the current production entry points.
6. Inspect CI/CD workflows.
7. Identify environment variables and secret-management conventions.
8. Inspect database connection and migration logic.
9. Identify background workers, scheduled jobs, queues, and file storage.
10. Inspect existing health checks, logs, and monitoring.
11. Identify the currently configured backup and recovery procedures.
12. Determine which changes are necessary for the requested task.

Inspect relevant files such as:

- `package.json`
- `Dockerfile`
- `docker-compose.yml`
- `azure.yaml`
- `vercel.json`
- GitHub Actions workflow files
- Azure deployment configuration
- Database migration files
- Environment variable examples
- Backend health-check endpoints

These files are examples, not mandatory files for every project.

Do not create deployment files that the project's framework or hosting configuration does not require.

Do not assume that a deployment target is configured merely because a configuration file exists.

## 3. Target Architecture

### 3.1 Backend

Primary provider: Azure.

Deploy the backend using an Azure service compatible with the application's framework, runtime, and operational requirements.

Potential services include:

- Azure App Service.
- Azure Container Apps.
- Azure Functions, when the application is suitable for a serverless execution model.

Choose the service based on the existing architecture, execution model, resource requirements, network configuration, and budget.

Maintain:

- Reproducible builds.
- Explicit runtime versions.
- Secure environment configuration.
- Health checks.
- Structured logging.
- Appropriate request timeouts.
- Graceful shutdown.
- Database connection management.
- Deployment verification.
- A documented rollback procedure.

Do not migrate a working backend to a different Azure service without a concrete technical reason.

### 3.2 Optional Backend Fallback

Vercel may host a secondary backend implementation if the framework, runtime, request duration, database connectivity, and required integrations are compatible.

Do not assume that an Azure backend can automatically run on Vercel.

Inspect the existing backend for dependencies on:

- Persistent local files.
- Long-running processes.
- Background workers.
- WebSockets or persistent connections.
- Platform-specific APIs.
- Native binaries.
- Long-running requests.
- Private networking.
- Azure-managed identities.
- Azure-specific storage or messaging.
- Framework-specific runtime requirements.

If the application depends on incompatible features, document the required adaptation before attempting to deploy a fallback.

Prefer a shared, portable application core and provider-specific adapters over maintaining two independently implemented versions of the business logic.

A Vercel deployment is not an active backup merely because it exists.

For it to function as a backend fallback, it must have:

- A successful deployment.
- Valid configuration.
- Compatible dependencies.
- Required secrets and permissions.
- Connectivity to the recovery database.
- Compatible database migrations.
- Working health checks.
- Verified application behavior.

Do not automatically switch backend traffic to an unverified deployment.

### 3.3 Frontend

Primary provider: Vercel.

Maintain the existing frontend framework and deployment architecture.

Requirements:

- Connect deployments to the intended Git repository.
- Separate preview and production environments.
- Verify build output.
- Validate required environment variables.
- Preserve production domain configuration.
- Verify frontend-to-backend connectivity.
- Keep deployment history available for rollback.
- Test critical routes after deployment.
- Verify authentication redirects and API requests.
- Avoid exposing server-side secrets in browser bundles.

Use Vercel's existing deployment and rollback capabilities where appropriate.

A rollback restores an earlier deployment; it does not automatically restore environment variables, database contents, or external service state.

Verify configuration compatibility after a rollback.

Do not delete previous known-good deployments unnecessarily.

## 4. Database Architecture

### 4.1 Primary Database: Supabase

Supabase PostgreSQL is the primary production data source.

All ordinary production writes should use the configured primary database unless the application explicitly implements another verified consistency model.

Maintain:

- Secure database credentials.
- Appropriate connection pooling.
- Least-privilege database roles.
- Correct transaction boundaries.
- Migration tracking.
- Schema version compatibility.
- Appropriate indexes and constraints.
- Database health monitoring.
- Backup verification.
- Recovery documentation.

Never assume that a working database connection proves that the database is recoverable.

### 4.2 Secondary Database: Neon

Neon PostgreSQL is the secondary recovery target.

Determine whether the intended design is:

1. An independently restored database that is updated through scheduled logical backups.
2. A regularly refreshed standby database.
3. A continuously synchronized replica, if supported and explicitly configured.

Do not describe a scheduled database export as continuous replication.

Do not assume that Supabase and Neon automatically synchronize data.

Before configuring replication or automated restoration, verify the compatibility of PostgreSQL versions, extensions, roles, ownership, privileges, schema changes, and replication mechanisms.

The recovery database must have a documented consistency guarantee and a known recovery point.

### 4.3 Failover Rules

Database failover must be an explicit, controlled process.

Before switching from Supabase to Neon:

1. Confirm the primary database is unavailable or unsafe to use.
2. Check whether the incident involves connectivity, application errors, or actual database failure.
3. Verify the recovery database's health and data freshness.
4. Determine the expected data-loss window.
5. Confirm the recovery schema is compatible with the application.
6. Prevent conflicting writes to the old and new primary databases.
7. Switch the database connection using a controlled configuration change.
8. Verify authentication, reads, writes, and critical transactions.
9. Record the incident and the selected recovery point.

Avoid automatic database promotion based solely on a single failed connection.

Transient network failures must not cause repeated switching between databases.

Never allow two independently writable databases to accept production writes without an explicit conflict-resolution and consistency strategy.

### 4.4 Returning to the Primary Database

Failback must be treated as a separate recovery operation.

Before returning to Supabase:

- Determine which database contains the authoritative data.
- Reconcile any writes performed during the outage.
- Apply missing migrations and required data changes.
- Verify integrity and consistency.
- Plan the write cutover.
- Confirm that no conflicting writes will occur.
- Test the restored production connection.

Do not simply change the connection string back to Supabase after an incident.

That action can cause data loss if Neon accepted writes during the recovery period.

## 5. Centralized Azure Backup Storage

Use Azure Blob Storage as the centralized off-provider backup destination for Supabase and Neon.

Keep backup storage logically separate from application deployment artifacts and database connection configuration.

Suggested organization:

    azure-backups/
      production/
        supabase/
          database/
          schema/
          manifests/
        neon/
          database/
          schema/
          manifests/
        recovery-reports/
        integrity-reports/

The actual container and directory names may differ, but backup ownership and provenance must remain clear.

### 5.1 Backup Contents

Back up the required database objects and data, including:

- Schema definitions.
- Tables and data.
- Relevant sequences.
- Constraints and indexes.
- Required database functions.
- Triggers and other required database objects.
- Relevant role and permission definitions, handled securely.
- Migration history.
- Backup timestamps.
- Source provider and database identity.
- PostgreSQL version information.
- Backup format and tool versions.
- Integrity verification results.

Identify provider-specific resources that ordinary PostgreSQL exports do not include.

For Supabase, separately assess whether the application requires backups or recovery procedures for:

- Authentication configuration and user data.
- Storage objects and file metadata.
- Row-level security policies.
- Edge Functions.
- Database extensions.
- Realtime configuration.
- Project settings and secrets.

Do not assume that a PostgreSQL dump includes all Supabase platform resources or stored files.

For Neon, separately assess branch configuration, roles, database settings, and other provider-specific resources.

Do not export secrets into an ordinary backup manifest.

### 5.2 Backup Methods

Choose a backup method appropriate to database size, recovery objectives, and provider capabilities.

Possible methods include:

- PostgreSQL logical exports using compatible `pg_dump` tooling.
- Provider-managed backups.
- Point-in-time recovery facilities.
- Verified replication or logical change capture.
- Provider-specific export mechanisms.

Use the method that provides the required recovery properties.

A logical export is not equivalent to a physical backup or point-in-time recovery.

For each backup method, document what it includes, what it excludes, and how it is restored.

Do not assume that an export contains a transactionally consistent point-in-time snapshot unless the chosen method guarantees that property.

### 5.3 Azure Storage Security

Use appropriate Azure Blob Storage security controls:

- Microsoft Entra ID and least-privilege access where supported.
- Managed identities for Azure-hosted backup jobs where appropriate.
- Encryption in transit.
- Encryption at rest.
- Private networking when justified and supported.
- Restricted container access.
- Separate backup and production application permissions.
- Auditing and operational logging.
- Retention and deletion controls.
- Versioning or immutability features when appropriate to the recovery requirements.

Do not make backup containers publicly accessible.

Do not embed storage account keys or database passwords in source code.

Do not give the normal application identity unnecessary permission to delete backup history.

Evaluate immutable storage policies carefully before enabling them, including retention periods, recovery procedures, and the consequences of accidental uploads.

Azure Blob Storage is the centralized backup destination; it does not automatically discover and back up every external database.

Implement and verify the export or backup transfer process explicitly.

## 6. Backup Scheduling and Retention

Define backup schedules according to the application's actual recovery objectives.

A suggested starting policy, subject to database size and budget, is:

- Daily full logical backup where feasible.
- More frequent backups or change capture for important databases with stricter recovery objectives.
- Periodic schema and configuration exports.
- Regular integrity checks.
- Periodic restoration tests.
- Retention tiers for recent, weekly, and monthly recovery points.

These are starting points, not guaranteed service levels.

Choose the actual schedule and retention period based on the acceptable data-loss window, storage costs, provider capabilities, and application requirements.

Every scheduled backup job should:

1. Validate its configuration.
2. Connect using appropriately scoped credentials.
3. Export or obtain the required backup.
4. Check that the operation completed successfully.
5. Validate that the output is non-empty and structurally plausible.
6. Compute an integrity checksum where appropriate.
7. Encrypt backup data when required by the chosen workflow.
8. Upload the artifact to Azure Blob Storage.
9. Verify the uploaded object.
10. Record metadata and the result.
11. Alert on failure.
12. Apply retention only after verifying that the required recovery points are protected.

Never report a backup as successful merely because the upload command returned success.

Verify the underlying export and the resulting artifact.

Keep backup jobs idempotent where possible.

Avoid overlapping jobs that create excessive load or inconsistent recovery points.

Use lifecycle policies only after confirming that they cannot delete the most recent valid recovery point or violate required retention.

## 7. Restore Testing and Disaster Recovery

A backup is useful only if it can be restored.

Implement a documented recovery procedure for:

- Supabase database loss.
- Neon database loss.
- Accidental data deletion.
- Corrupted database contents.
- Failed database migrations.
- Azure backend outages.
- Vercel deployment failures.
- Exposed credentials.
- Accidental backup deletion.
- Loss of required configuration.

### Restore Procedure

For a database recovery test:

1. Select a known backup.
2. Verify its provenance and integrity.
3. Restore it to an isolated test database.
4. Apply any required recovery steps.
5. Check the schema and migration history.
6. Validate row counts and important relationships.
7. Run application-level smoke tests.
8. Verify permissions and critical database functions.
9. Record the restoration duration.
10. Document any missing objects or recovery limitations.

Do not restore a test backup directly over production.

Do not perform destructive production recovery operations without explicit authorization.

### Recovery Objectives

Define:

- Recovery Point Objective (RPO): the maximum acceptable amount of data loss, measured in time.
- Recovery Time Objective (RTO): the target duration for restoring service.

Measure both using actual backup and recovery tests.

Do not claim an RPO of zero unless the architecture and consistency guarantees substantiate it.

Do not claim automatic recovery merely because a recovery script exists.

## 8. Deployment and CI/CD

Use the project's existing deployment pipeline when possible.

A typical release workflow is:

1. Run linting and type checks.
2. Run relevant automated tests.
3. Build the application.
4. Validate required configuration.
5. Apply compatible database migrations through a controlled process.
6. Deploy the backend to Azure.
7. Verify backend health.
8. Deploy the frontend to Vercel.
9. Verify frontend routes and API connectivity.
10. Run production smoke tests.
11. Monitor for errors.
12. Record the release and recovery reference.

Adjust the sequence for the actual application architecture.

Avoid applying destructive schema changes before compatible application code is ready.

Prefer backward-compatible database changes when possible:

1. Add compatible schema changes.
2. Deploy code that supports both old and new structures.
3. Migrate data safely.
4. Verify behavior.
5. Remove obsolete structures only after dependent code has been retired.

Use staged or expand-and-contract migrations for changes that must support rolling deployments or old application versions.

Do not run migrations concurrently from multiple deployment instances without an appropriate migration-locking strategy.

Use separate preview, staging, and production credentials.

Never expose production secrets to untrusted preview builds.

### Rollback Rules

A rollback should restore a known-good application version without unintentionally reversing valid production data.

Before rolling back:

- Identify the last known-good deployment.
- Determine whether database migrations are backward compatible.
- Confirm environment variable compatibility.
- Check whether external services or scheduled jobs changed.
- Verify that the rollback will not repeat destructive side effects.

Do not automatically roll back database migrations that have already modified production data.

Use a documented corrective migration or recovery procedure when necessary.

## 9. Health Checks and Monitoring

Monitor each layer independently.

### Frontend

Check:

- Production page availability.
- Critical routes.
- Browser runtime errors when observable.
- Frontend-to-backend connectivity.
- Authentication flows.
- Failed asset loading.

### Backend

Check:

- HTTP health endpoint.
- Startup and dependency health.
- Response latency.
- HTTP error rates.
- Resource usage.
- Database connectivity.
- Background job failures.
- Authentication and authorization errors.

Use a lightweight liveness endpoint and a separate readiness check when supported by the hosting architecture.

Do not make a liveness check depend on every external service if doing so could cause healthy application instances to restart unnecessarily.

### Database

Monitor:

- Connection failures.
- Connection pool saturation.
- Query errors.
- Query latency.
- Storage usage.
- Backup freshness.
- Recovery target freshness.
- Replication lag, when actual replication is configured.
- Failed migration attempts.
- Integrity-check failures.

### Backup System

Alert on:

- Missed backup schedules.
- Failed exports.
- Failed uploads.
- Unexpectedly small or empty backup artifacts.
- Failed integrity checks.
- Expired credentials.
- Insufficient storage.
- Retention policy failures.
- Missing recovery points.
- Failed restoration tests.

Never treat the absence of an alert as proof that the backup system is healthy.

Use explicit freshness checks and test restoration periodically.

## 10. Secrets and Environment Configuration

Use provider-specific secret stores and appropriately scoped credentials.

Potential mechanisms include:

- Azure Key Vault.
- Azure managed identities.
- Vercel environment variables.
- GitHub Actions secrets or supported OIDC-based authentication.
- Restricted database credentials.

Use the least privileged identity appropriate for each operation.

Keep separate credentials for:

- Application database access.
- Backup export.
- Backup upload.
- Backup restoration.
- Deployment automation.
- Administrative recovery.

Where feasible, separate the ability to create backups from the ability to delete them.

Maintain a documented inventory of required environment variable names and their intended providers.

Do not commit secret values to:

- Source code.
- `.env` files tracked by Git.
- Public deployment configuration.
- Build artifacts.
- Logs.
- Backup manifests.
- Documentation.

If a credential is exposed, recommend revoking or rotating it and checking for unauthorized access.

Never print secret values in the final report.

## 11. Incident Response

When a production incident occurs:

1. Establish the affected service.
2. Determine whether the issue is a deployment, configuration, database, network, or dependency failure.
3. Inspect available logs and health checks.
4. Preserve relevant diagnostic evidence.
5. Choose the least risky recovery action.
6. Restore service when appropriate.
7. Verify application behavior.
8. Check data integrity.
9. Document the root cause and recovery steps.

Do not automatically fail over because of a single transient error.

Use consecutive failures, appropriate timeouts, and recovery checks where automated health-based failover is implemented.

Avoid retry storms and repeated provider switching.

Do not initiate a database failover without assessing data freshness and write consistency.

For a failed deployment, prefer a known-good application rollback when it is safe and compatible with the current database schema.

For data corruption, prioritize preserving evidence and selecting a valid recovery point before resuming writes.

## 12. External References

Consult official documentation when a task involves provider-specific deployment or recovery behavior.

### Azure

- Azure App Service: https://learn.microsoft.com/azure/app-service/
- Azure Container Apps: https://learn.microsoft.com/azure/container-apps/
- Azure Blob Storage: https://learn.microsoft.com/azure/storage/blobs/
- Azure Storage security: https://learn.microsoft.com/azure/storage/common/storage-security-guide
- Azure Key Vault: https://learn.microsoft.com/azure/key-vault/

### Vercel

- Deployments: https://vercel.com/docs/deployments
- Rollback: https://vercel.com/docs/cli/rollback
- Environment variables: https://vercel.com/docs/environment-variables

### Supabase

- Database overview: https://supabase.com/docs/guides/database/overview
- Database backups: https://supabase.com/docs/guides/platform/backups
- PostgreSQL connection management: https://supabase.com/docs/guides/database/connecting-to-postgres

### Neon

- Documentation: https://neon.tech/docs
- PostgreSQL import and export: https://neon.tech/docs/import/import-from-postgres

Verify that the relevant documentation and features are current before implementation.

Do not assume that a feature is available on every provider plan.

Do not invent commands, APIs, permissions, or configuration settings.

## 13. Cost and Resource Management

Prefer the simplest architecture that meets the recovery requirements.

Evaluate:

- Hosting costs.
- Database storage.
- Backup storage.
- Backup transfer.
- Database compute.
- Connection limits.
- Monitoring costs.
- Recovery infrastructure.
- Egress costs.
- Retention duration.
- Idle standby resources.

Avoid permanently running duplicate compute resources when a tested redeployment or restore procedure meets the required recovery objectives.

However, do not present a cold recovery target as equivalent to an immediately available standby.

Clearly distinguish between:

- Cold standby: recovery requires deployment, restoration, or startup.
- Warm standby: infrastructure is provisioned but may need promotion or configuration changes.
- Hot standby: the recovery service is already running and prepared to accept traffic, subject to verified readiness.

Choose according to the actual availability and budget requirements.

## 14. Change Safety

Before modifying infrastructure:

- Inspect the current configuration.
- Identify production resources.
- Determine the effect of the change.
- Identify rollback and recovery options.
- Verify required permissions.
- Protect existing user changes.
- Avoid destructive defaults.

Require explicit authorization before destructive or irreversible operations such as:

- Deleting production resources.
- Dropping production databases.
- Overwriting valid recovery points.
- Replacing production secrets.
- Changing production DNS.
- Enabling a potentially disruptive failover.
- Running destructive migrations.
- Disabling security controls.

Do not deploy to production simply because a local build succeeds.

Do not create or modify cloud resources without the required authorization.

Do not assume that the existence of a cloud account grants permission to provision resources or incur costs.

## 15. Completion Report

After deployment or infrastructure changes, report:

### Architecture

Describe the services and recovery paths that were actually configured.

### Files Modified

List the configuration, workflow, script, and application files changed.

### Backup Status

Report the actual backup method, destination, timestamp, integrity-check results, and retention configuration when available.

### Deployment Status

Report the actual provider, deployment environment, build result, health-check result, and production verification status.

### Recovery Readiness

Identify which recovery procedures were tested and which remain unverified.

### Security and Cost

Report important permissions, secret-handling changes, resource additions, and known cost implications.

### Remaining Risks

Clearly identify any unconfigured fallback, missing backup, untested restore, compatibility issue, or provider limitation.

Never claim that a backup exists without verifying the artifact or provider backup status.

Never claim that failover works without testing the relevant recovery path.

Never claim a deployment is production-ready when critical checks remain unresolved.

---

## Final Principle

Azure is the primary backend host. Vercel is the primary frontend host and an optional backend fallback only when compatibility and recovery requirements are satisfied. Supabase is the primary PostgreSQL database. Neon is the secondary recovery database. Azure Blob Storage is the centralized off-provider backup destination for both database providers.

Keep these roles explicit.

Backups must be independent, protected, verifiable, and restorable.

Deployments must be reproducible.

Failover must preserve data integrity.

Recovery must be tested.

Never confuse a second provider with a functioning disaster-recovery system.

