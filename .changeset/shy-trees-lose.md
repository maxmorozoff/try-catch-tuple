---
"@maxmorozoff/try-catch-tuple": patch
---

docs:

- Add JSDoc for TryCatch types

chore:

- Export missing types
- Update default error type
- Update Branded type
- Update DataErrorTuple type (e.g., `rest` is now `never[]`)
- Restrict array methods on DataErrorTuple
- Make `fn` parameter required

refactor:

- Extract DataErrorTuple to type alias
