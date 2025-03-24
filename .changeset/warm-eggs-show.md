---
"@maxmorozoff/try-catch-tuple": minor
---

feat: enhance error handling and improve TypeScript support

#### Added

- Introduced `.errors<E>()` method to allow specifying expected error types.
- Ensured non-Error thrown values are wrapped properly in an `Error` instance with `cause`.
- Added more tests to cover edge cases and ensure robustness.

#### Improved

- Refactored `tryCatch`, `tryCatch.sync`, and `tryCatch.async` to support generic error types.
- Introduced `TryCatchFunc` and `TryCatchResult` for improved type safety.
- Updated `typescript` version range in `peerDependencies` to `^5.0.0`, supporting all 5.x versions.
- Added `peerDependenciesMeta` to mark `typescript` as an optional dependency. This allows consumers of the package to choose not to install `typescript` while still ensuring compatibility with TypeScript 5.x.

#### Fixed

- `handleError` now correctly preserves the original thrown value under `cause`.
