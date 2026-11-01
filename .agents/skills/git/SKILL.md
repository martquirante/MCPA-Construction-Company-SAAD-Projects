---
name: git
description: Best practices for Git version control, atomic commits, conventional commit messages, branching strategies, conflict resolution, diff inspection, pull requests, and safe repository operations. Use when committing changes, managing branches, creating pull requests, resolving merge conflicts, inspecting repository history, or performing version control workflows.
---

# Git Version Control & Repository Standards

## 1. Core Principles

- **Atomic Commits**: Each commit should represent a single logical change or cohesive unit of work. Avoid omnibus commits that bundle unrelated fixes, refactorings, and features.
- **Inspect Diffs Before Committing**: Always review `git status` and `git diff` (staged and unstaged) before staging and committing files to ensure no accidental changes or secrets are included.
- **Safety First**: Never perform destructive operations (`git reset --hard`, `git clean -fd`, `git push --force`) on shared branches or without explicit confirmation and uncommitted work stashed.
- **Preserve Clean History**: Write clear, descriptive commit messages that explain the *why* and *what*, not just the *how*.

---

## 2. Commit Message Standards (Conventional Commits)

Format: `<type>(<scope>): <short description>`

### Types
- `feat`: A new feature for the user or consumer
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `style`: Formatting, whitespace, semicolon changes (no code logic change)
- `test`: Adding missing tests or correcting existing tests
- `docs`: Documentation updates only
- `chore`: Updating build tasks, package manager configs, dependencies
- `ci`: CI/CD configuration files and scripts

### Guidelines
1. Use the imperative mood in the summary: "add payment webhook handler" instead of "added payment webhook handler" or "adds payment webhook handler".
2. Keep the subject line under 72 characters and lowercase (after the type prefix).
3. Do not end the subject line with a period.
4. If a body is necessary, separate it from the subject with a blank line, explaining context, problem solved, and trade-offs.

---

## 3. Pre-Commit Checklist

Before staging and committing:
1. **Status Check**: Run `git status` to identify modified, untracked, and deleted files.
2. **Review Diffs**: Run `git diff` and `git diff --staged` to verify:
   - No sensitive information (API keys, passwords, `.env` files, tokens) is staged.
   - No temporary debug statements, `console.log`, or scratch files are left behind.
   - Formatting and indentation adhere to project conventions.
3. **Build & Test**: Ensure unit tests pass and build commands succeed before finalizing the commit.
4. **Targeted Staging**: Stage specific files (`git add <file>`) rather than blanket staging (`git add .`) when unrelated files are touched.

---

## 4. Branching Strategy

- **Main / Production Branch** (`main` or `master`): Always deployable and stable. Direct commits should be restricted.
- **Feature Branches** (`feature/<feature-name>` or `feat/<name>`): For developing new capabilities.
- **Bugfix Branches** (`fix/<bug-name>` or `bugfix/<name>`): For resolving defects.
- **Hotfix Branches** (`hotfix/<issue>`): For urgent production fixes.
- **Release / Chore Branches** (`chore/<task>`): For dependency upgrades or tooling adjustments.

---

## 5. Conflict Resolution Workflow

When merging or rebasing encounters conflicts:
1. Run `git status` to identify unmerged paths.
2. Open each conflicted file and inspect conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Understand the intent of both changes before resolving; do not blindly overwrite one side.
4. Test the code thoroughly after resolution to confirm semantic correctness.
5. Stage the resolved files (`git add <file>`).
6. Complete the operation (`git commit` for merge, or `git rebase --continue` for rebase).

---

## 6. Safe History & Recovery Protocols

- **Stashing Work**: Use `git stash push -m "description"` before switching branches or pulling changes with a dirty working tree. Use `git stash pop` or `git stash apply` to restore.
- **Viewing History**:
  - `git log --oneline --graph --decorate -n 20`: Visual overview of recent commits.
  - `git log -p <file>`: Detailed change history of a specific file.
  - `git blame <file>`: Identify line-by-line commit authorship.
- **Undo / Recovery**:
  - Unstage a file: `git restore --staged <file>`
  - Discard local modifications in working tree: `git restore <file>`
  - Find lost commits or recover from accidental branch deletes: `git reflog`

