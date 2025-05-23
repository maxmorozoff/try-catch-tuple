# @maxmorozoff/try-catch-tuple

## 0.1.2

### Patch Changes

- 73951e0: docs:

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

## 0.1.1

### Patch Changes

- 6702a10: introduce branded tuple type

## 0.1.0

### Minor Changes

- 23d5176: feat: enhance error handling and improve TypeScript support

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

## 0.0.2

### Patch Changes

- 30b1a4e: Update README
