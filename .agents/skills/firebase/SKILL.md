---
name: firebase
description: Guidance on Firebase Auth, Firestore schema, Security Rules, Cloud Functions, and client SDK integration.
---

# Firebase Best Practices

## Rules
1. **Security Rules**: Never allow read/write access to `true` in production (`allow read, write: if request.auth != null;` at minimum).
2. **Query Efficiency**: Index compound queries and avoid reading entire collections into memory.
3. **Client Architecture**: Centralize Firebase initialization in a single service layer; handle offline cache gracefully.