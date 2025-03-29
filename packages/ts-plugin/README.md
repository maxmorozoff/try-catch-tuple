# tryCatch Tuple Validator (TypeScript Plugin & Transformer)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Placeholder Badge -->

Ensure correct destructuring of `[data, error]` tuples returned by `tryCatch`-like functions, both in your IDE and during build time.

## Overview

This project provides two tools to enforce a specific destructuring pattern for functions (like a custom `tryCatch` utility) that return a branded tuple representing a result and a potential error:

1.  **Language Service Plugin (`ts-trycatch-plugin`):** Provides real-time feedback, error highlighting, and code fixes directly within your TypeScript-aware editor (like VS Code).
2.  **Build Transformer (`ts-trycatch-transformer`):** Integrates with `tsc` (via `ts-patch`) to validate the pattern during your build process, allowing you to catch errors in CI/CD or build steps.

The primary goal is to prevent developers from incorrectly handling the results of `tryCatch` calls, such as ignoring the error tuple element or using incorrect destructuring patterns.

## Features

- **Strict Destructuring:** Enforces that results are destructured as `[data, error]` or `[data, ,]`.
- **Configurable Error Ignoring:** Option (`allowIgnoredError`, defaults to `true`) permits `[data, ,]` for explicitly ignoring the error.
- **Direct & Await Calls:** Validates both `const [d,e] = tryCatch(...)` and `const [d,e] = await tryCatch(...)`.
- **Wrapped Call Detection:** Uses the TypeScript Type Checker to identify calls to wrapper functions that return the expected branded tuple type (configurable via `checkWrappedCalls`).
- **Branded Type Support:** Specifically looks for a unique property (`__tryCatchTupleResult`) on the return type to accurately identify relevant wrapped calls. The _presence_ of the brand property is key; its specific value usually doesn't matter.
- **IDE Integration:** Language Service Plugin provides squiggles and Quick Fixes.
- **Build-Time Checks:** Transformer integrates with `tsc` via `ts-patch` to report errors/warnings during compilation.
- **Configurable Severity:** Report issues as errors or warnings.

## Installation

```bash
# If using the build transformer, ts-patch is also required
npm i -D @maxmorozoff/try-catch-tuple-ts-plugin ts-patch typescript
# Or for LSP only:
# npm i -D @maxmorozoff/try-catch-tuple-ts-plugin typescript
```

## Configuration (`tsconfig.json`)

Add the plugin/transformer configuration to your `tsconfig.json` under `compilerOptions.plugins`.

**1. Both LSP Plugin and Build Transformer (Recommended Combined Approach - Requires `ts-patch`):**

This is the preferred way if using both, as configuration is shared.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // ... your other options
    "plugins": [
      {
        // Both 'name' (for LSP) and 'transform' (for build) in one entry
        "name": "@maxmorozoff/try-catch-tuple-ts-plugin",
        "transform": "@maxmorozoff/try-catch-tuple-ts-plugin/transformer",
        // --- SHARED Configuration (applies to both LSP & Transformer) ---
        "errorLevel": "error", // or "warning". Default: "error"
        "allowIgnoredError": true, // Default: true
        "checkWrappedCalls": true // Default: true
      }
    ]
  },
  "include": ["src/**/*"]
}
```

**2. LSP Plugin Only:**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // ... your other options
    "plugins": [
      {
        "name": "@maxmorozoff/try-catch-tuple-ts-plugin",
        // --- Optional Configuration for LSP ---
        "errorLevel": "error", // "error" or "warning"
        "allowIgnoredError": true, // true or false
        "checkWrappedCalls": true // true or false
      }
    ]
  },
  "include": ["src/**/*"]
}
```

**3. Build Transformer Only (Requires `ts-patch`):**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // ... your other options
    "plugins": [
      {
        "transform": "@maxmorozoff/try-catch-tuple-ts-plugin/transformer", // Path to transformer
        // --- Optional Configuration for Transformer ---
        "errorLevel": "error", // "error" or "warning"
        "allowIgnoredError": true, // true or false
        "checkWrappedCalls": true // true or false
      }
    ]
  },
  "include": ["src/**/*"]
}
```


## Usage

**1. IDE (Language Service Plugin):**

- **Restart TS Server:** After adding/changing the plugin configuration in `tsconfig.json`, you **must restart the TypeScript Server** in your editor.
  - _VS Code:_ Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run `TypeScript: Restart TS server`.
- You should now see errors/warnings underlined in your code and have Quick Fixes available.

**2. Build (Transformer):**

- **Install `ts-patch`:** (If not already done) `npm i -D ts-patch`
- **Patch TypeScript:** Run `npx ts-patch install` (or `yarn ts-patch install`) in your project root. This only needs to be done once or after updating TypeScript/ts-patch.
- **Run Build:** Use `tspc` instead of `tsc` in your build scripts/commands.

  ```bash
  # Example command
  npx tspc -p tsconfig.json

  # Example package.json script
  "scripts": {
    "build": "tspc -p tsconfig.json"
  }
  ```

  Build errors/warnings from the transformer will appear in the `tsc` output.

## Configuration Options

These options can be configured within the `plugins` entry in your `tsconfig.json`:

| Option              | Type                     | Default   | Description                                                                                                                                 |
| :------------------ | :----------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `errorLevel`        | `"error"` \| `"warning"` | `"error"` | Sets the severity level. For the transformer, `"error"` reports as a `tsc` error, potentially failing the build.                            |
| `allowIgnoredError` | `boolean`                | `true`    | If `true`, allows destructuring as `[data, ,]` to explicitly ignore the error element.                                                      |
| `checkWrappedCalls` | `boolean`                | `true`    | If `true`, uses the Type Checker to analyze calls to functions other than `tryCatch` to see if they return the expected branded tuple type. |

## The Expected `tryCatch` Result Type

This tool is designed to work with functions that return a specific **branded tuple union** type structure, typically defined like this:

```typescript
// Shared brand interface (can be empty or have specific properties)
interface TryCatchBrand {
  __tryCatchTupleResult: "marker"; // Or any unique property/type
}

// Success case: Branded tuple with data and null error
type Success<T> = TryCatchBrand & [data: T, error: null];

// Failure case: Branded tuple with null data and an error
type Failure<E> = TryCatchBrand & [data: null, error: E | Error];

// The final union type
type Result<T, E> = Success<T> | Failure<E>;

// Your tryCatch function signature might look like:
// declare function tryCatch<T, E = Error>(fn: () => T): Result<T, E>;
// declare function tryCatch<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>>;
```

The **brand property** (`__tryCatchTupleResult` in this example) is crucial for the `checkWrappedCalls` feature to reliably identify wrapper functions that return this specific structure, distinguishing it from other unrelated two-element tuples.

## Validation Rules

The plugin and transformer enforce the following:

**Valid Usage:**

```typescript
// Standard
const [data, error] = tryCatch(...);
const [data, err] = await tryCatch(...);

// Using underscore for error is fine
const [data, _] = tryCatch(...);

// Explicitly ignoring error (Valid by default, requires allowIgnoredError: true if default changes)
const [data, ,] = tryCatch(...);

// Wrapped calls (if checkWrappedCalls: true and type matches)
const wrapped = () => tryCatch(...);
const [d, e] = wrapped();
const [d2, e2] = await wrapped();
```

**Invalid Usage:**

```typescript
// Not destructured
const result = tryCatch(...);

// Missing error element (when allowIgnoredError: false)
// Note: With the default allowIgnoredError: true, this specific single-element
// destructuring IS typically flagged as invalid by the plugin, as it expects two positions.
const [data] = tryCatch(...); // Generally invalid

// Destructuring less than 2 elements
const [] = tryCatch(...);

// Destructuring more than 2 elements
const [data, error, extra] = tryCatch(...);

// Wrapped calls with incorrect destructuring (if checkWrappedCalls: true)
const wrapped = () => tryCatch(...);
const [d] = wrapped(); // Invalid
const res = await wrapped(); // Invalid (not destructured)
```

## Code Fixes (Language Service Plugin)

When an invalid destructuring pattern is detected in the IDE, the plugin provides Quick Fixes (usually via a lightbulb icon or keyboard shortcut):

1.  **`Destructure return as [result, error]`**: Changes invalid patterns like `[result]` or `result` to `[result, error]`.
2.  **`Destructure return as [result, ,] (ignore error)`**: (Only shown if `allowIgnoredError` is `true`, which is the default) Changes invalid patterns to `[result, ,]`.

## Development

```bash
# Install dependencies
bun install

# Build plugin and transformer
bun run build

# Run tests
bun run test
```

## Contributions

Contributions of any kind are much appreciated.

<!-- Please refer to the contribution guidelines (TBD). -->

## License

[MIT](./LICENSE)
