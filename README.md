# tryCatch Utility & Validation Tools

[![CI](https://github.com/maxmorozoff/try-catch-tuple/actions/workflows/ci.yml/badge.svg)](https://github.com/maxmorozoff/try-catch-tuple/actions/workflows/ci.yml)
[![Release](https://github.com/maxmorozoff/try-catch-tuple/actions/workflows/release.yml/badge.svg)](https://github.com/maxmorozoff/try-catch-tuple/actions/workflows/release.yml)
[![try-catch NPM Version](https://img.shields.io/npm/v/%40maxmorozoff%2Ftry-catch-tuple?label=tryCatch)](https://www.npmjs.com/package/@maxmorozoff/try-catch-tuple)
[![ts-plugin NPM Version](https://img.shields.io/npm/v/%40maxmorozoff%2Ftry-catch-tuple-ts-plugin?label=ts-plugin)](https://www.npmjs.com/package/@maxmorozoff/try-catch-tuple-ts-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://github.com/maxmorozoff/try-catch-tuple/LICENSE)

A TypeScript utility for Go-style structured error handling (`[data, error]`) combined with powerful tooling (TypeScript Plugin & Build Transformer) to ensure correctness.

## Overview

This repository provides two key components designed to work together:

1. **[`try-catch-tuple`](#trycatch-utility-maxmorozofftry-catch-tuple):** A utility function for wrapping synchronous or asynchronous operations, returning a tuple `[data, error]` inspired by Go's error handling pattern (error last).
2. **[`try-catch-tuple-ts-plugin`](#plugin--transformer-maxmorozofftry-catch-tuple-ts-plugin):** Tooling (Language Service Plugin + Build Transformer) that integrates with TypeScript to enforce correct destructuring and handling of the `[data, error]` tuple returned by the utility.

> [!IMPORTANT]  
> While `try-catch-tuple` is considered production-ready due to its minimal implementation approach,  
> `try-catch-tuple-ts-plugin` is a proof of concept (PoC) and still in its early stages.

## Showcase: Plugin & Code Fixes

_(See the TypeScript plugin in action, catching errors and providing fixes in the editor)_

https://gist.github.com/user-attachments/assets/1c00381f-985a-4484-b2a1-e87665877fb4

## Rationale: Error Last & Tooling

Traditional Node.js error handling often uses callbacks with `(error, data)`. Many modern utilities and proposals ([like this one](https://github.com/arthurfiorette/proposal-try-operator)) also adopt an "error first" tuple `[error, data]`.

This library takes a different approach, placing the **error last (`[data, error]`)**, similar to Go.

**Why `error` last?**

- **Scanning Intent:** When fetching or processing data, the primary goal is often the `data`. Placing it first aligns the code structure with the primary intent, potentially making success paths easier to visually scan. Code often reads like "get the data, then check for an error".
- **Intuition:** For developers familiar with Go or similar paradigms, this can feel more natural.

**The Challenge: Explicit Error Handling**

A potential downside of the error-last pattern is the risk of accidentally forgetting to check the `error` value. As discussed in community ([like this issue](https://github.com/arthurfiorette/proposal-try-operator/issues/13) or [this gist comment](https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b?permalink_comment_id=5511839#gistcomment-5511839)), error handling should ideally be explicit. Swallowing errors silently is dangerous.

**The Solution: Tooling Enforcement**

This repository strongly advocates for using the provided **TypeScript tooling** alongside the `tryCatch` utility. The Language Service Plugin and Build Transformer act as a safety net:

- They **enforce** that the returned tuple is destructured correctly (`[data, error]` or `[data, ,]`).
- They prevent accidentally ignoring the error (e.g., `const [data] = tryCatch(...)` or `const result = tryCatch(...)`).
- This allows developers to benefit from the potential readability of the error-last pattern while **mitigating the risk** of unhandled errors through compile-time and IDE checks.

Essentially, we leverage TypeScript's powerful type system and tooling capabilities to make the error-last pattern safe and explicit.

## Why a Tuple (`[data, error]`) Return Type?

While other libraries or patterns might return an object like `{ data: T, error: E }`, this utility deliberately uses a tuple `[data, error]`. This decision is intertwined with the "Error Last" rationale and the emphasis on tooling:

1. **Explicit Handling Encouraged:** With an object `{ data, error }`, it's syntactically very easy to ignore the error property simply by omitting it during destructuring:

   ```typescript
   // Easy to forget the error without tooling
   const { data } = tryCatchReturningObject(...); // 'error' is implicitly ignored
   ```

   While convenient, this increases the risk of accidentally swallowing errors if the developer forgets to handle the `error` case separately. The tuple structure `[data, error]` forces the developer to acknowledge both positions during destructuring.

2. **Cleaner Renaming (Especially for Data):** Renaming during destructuring is arguably more straightforward for the primary `data` value with tuples:

   ```typescript
   // Tuple Renaming
   const [user, userError] = tryCatch(...); // 'user' directly gets the data

   // Object Renaming
   const { data: user, error: userError } = tryCatchReturningObject(...); // Requires explicit 'data:' label
   ```

   While minor, it keeps the focus on the primary success value when renaming.

3. **Tooling Makes Tuples Safe:** The potential drawback of tuples (like forgetting which index is which, although named tuples mitigate this) is less significant when paired with the TypeScript plugin/transformer. The tooling enforces that _both_ elements are acknowledged (either `[data, error]` or `[data, ,]` if allowed), effectively preventing the accidental ignoring of the `error` element, which was the main safety concern with the tuple pattern.

4. **Future Considerations (Object/Combined Approach):** We recognize the ergonomic benefits an object-based or combined approach (like [czy.js](https://github.com/osoclos/czy-js)) can offer. While the current focus is on the tuple pattern enforced by tooling, **we may explore supporting an object-based return type as a configurable option in the future.** Contributions towards this are welcome! The goal would be to ensure any approach maintains explicit error handling, potentially through enhanced tooling checks specific to the object pattern.

## Why a TypeScript Plugin/Transformer (vs. ESLint)?

While ESLint is a powerful and widely-used linting tool, we chose to implement this validation logic directly within the TypeScript ecosystem (as a Language Service Plugin and a Build Transformer) for several key reasons:

1. **Deep Type System Integration:** The core requirement of validating wrapped function calls (`checkWrappedCalls: true`) necessitates understanding the _return types_ of functions. This requires deep integration with TypeScript's Type Checker, which is readily available within TS Plugins and Transformers but often more complex or less performant to achieve accurately within ESLint rules (which typically operate more on the AST structure).
2. **Build Process Integration (`tsc`):** The build transformer integrates directly into the `tsc` compilation process via `ts-patch`. This ensures that validation failures (when configured as errors) block the build itself, providing a strong guarantee of correctness before code is shipped. While ESLint can be part of a build script, it runs as a separate step.
3. **Real-time IDE Feedback:** Language Service Plugins offer the tightest integration with editors like VS Code, providing instant feedback, squiggles, and code fixes as you type. Achieving the same level of responsiveness and type-aware code fixes with ESLint can be more challenging.
4. **Evolving Linting Landscape:** While ESLint remains dominant, the ecosystem for linting and formatting JavaScript/TypeScript is evolving, with tools like Biome gaining traction. Focusing on TypeScript's own extension points provides a robust solution tied directly to the language itself.

**ESLint Rule Possibility:**

That being said, an ESLint rule _could_ potentially be developed to cover at least the _basic_ destructuring validation (checking `const [a,b] = tryCatch(...)` vs `const result = tryCatch(...)`). Implementing the type-checking required for wrapped calls would be the main challenge.

**We welcome contributions!** If you're interested in developing and maintaining an ESLint plugin for this utility, please feel free to open an issue or pull request to discuss it.

## `tryCatch` Utility (`@maxmorozoff/try-catch-tuple`)

### Features

- Handles both synchronous and asynchronous functions/promises.
- Returns a structured, branded tuple `[data, error]`.
- Provides named operations (`tryCatch(fn, "Operation Name")`) for better debugging context in errors.
- Includes `tryCatch.sync` and `tryCatch.async` for explicit handling.
- Allows custom error types via `.errors<E>()`.
- Ensures all thrown values are normalized into `Error` instances.

### Basic Usage

```typescript
import { tryCatch } from "@maxmorozoff/try-catch-tuple";

// Synchronous
function parseJson(str: string) {
  const [result, error] = tryCatch(() => JSON.parse(str) as { id: number });
  //     ^? const result: { id: number } | null

  if (error) {
    // Always check the error!
    console.error("Parsing failed:", error); // `error` is an `Error` instance
    //                               ^? const error: Error
    return null;
  }

  // Type refinement works here
  return result; // ✅ result: { id: number }
}

// Asynchronous
async function fetchUser(id: number): Promise<User> {
  // ... fetch logic
  if (id < 0) throw new Error("Invalid ID");
  return { name: "Alice" };
}

async function getUser(id: number) {
  const [user, error] = await tryCatch(fetchUser(id));
  //     ^? const user: User | null

  if (error) {
    console.error(`Failed to get user ${id}:`, error.message);
    return null;
  }

  return user; // ✅ user: User
}
```

_(See more advanced `tryCatch` usage examples and API reference further down.)_

## Plugin & Transformer (`@maxmorozoff/try-catch-tuple-ts-plugin`)

### Plugin Features

- **Strict Destructuring:** Enforces `[data, error]` or `[data, ,]` (if configured).
- **Configurable Error Ignoring:** `allowIgnoredError` option (defaults to `true`) permits `[data, ,]`.
- **Direct & Await Call Validation:** Catches errors in both sync and async contexts.
- **Wrapped Call Detection:** Uses Type Checker + branding to validate results from wrapper functions (`checkWrappedCalls`, default `true`).
- **IDE Integration:** Real-time errors/warnings and Quick Fixes in editors like VS Code.
- **Build-Time Checks:** Reports errors/warnings during `tsc` compilation via `ts-patch`.
- **Configurable Severity:** Report as `"error"` or `"warning"`.

## Installation

```bash
# 1. Install the utility (prod dependency):
npm i @maxmorozoff/try-catch-tuple 

# 2. Install ts plugin (dev dependencies):

# If using the build transformer, ts-patch is also required
npm i -D @maxmorozoff/try-catch-tuple-ts-plugin ts-patch typescript

# Or for utility + LSP only:
npm i -D @maxmorozoff/try-catch-tuple-ts-plugin typescript
```

## Configuration (`tsconfig.json`)

Configure the tooling under `compilerOptions.plugins`.

**1. Both LSP Plugin and Build Transformer (Recommended Combined Approach - Requires `ts-patch`):**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // ... your other options
    "plugins": [
      {
        "name": "@maxmorozoff/try-catch-tuple-ts-plugin", // For LSP
        "transform": "@maxmorozoff/try-catch-tuple-ts-plugin/transformer", // For Build
        // --- SHARED Configuration (applies to both) ---
        "errorLevel": "error", // Default: "error"
        "allowIgnoredError": true, // Default: true
        "checkWrappedCalls": true // Default: true
      }
    ]
  }
  // ...
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
        "errorLevel": "error",
        "allowIgnoredError": true,
        "checkWrappedCalls": true
      }
    ]
  }
  // ...
}
```

## Usage

### 1. IDE (Language Service Plugin)

- **Select Workspace TypeScript Version:** Ensure your editor is using the workspace's TypeScript version instead of the built-in one (e.g., VS Code: `TypeScript: Select TypeScript Version`).
- **Restart TS Server:** After configuring the plugin, **restart the TypeScript Server** (e.g., VS Code: `TypeScript: Restart TS server`).
- Errors will be underlined, and Quick Fixes will be available.

### 2. Build (Transformer)

#### Method 1: Live Compiler

The live compiler patches on-the-fly, each time it is run.

**Via commandline:** Simply use `tspc` (instead of `tsc`)

**With tools such as ts-node, webpack, ts-jest, etc:** specify the compiler as  `ts-patch/compiler`

#### Method 2: Persistent Patch

Persistent patch modifies the typescript installation within the `node_modules` path. It requires additional configuration
to remain persisted, but it carries less load time and complexity compared to the live compiler.

1. Install the patch

```shell
# For advanced options, see: ts-patch /?
ts-patch install
```

2. Add `prepare` script (keeps patch persisted after npm install)

`package.json`
```jsonc
{
  /* ... */
  "scripts": {
    "prepare": "ts-patch install -s"
  }
}
```

For advanced options, see: [ts-patch docs](https://github.com/nonara/ts-patch?tab=readme-ov-file#usage)

## Configuration Options (Plugin & Transformer)

| Option              | Type                     | Default   | Description                                                                                                                                 |
| :------------------ | :----------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `errorLevel`        | `"error"` \| `"warning"` | `"error"` | Sets the severity level. For the transformer, `"error"` reports as a `tsc` error, potentially failing the build.                            |
| `allowIgnoredError` | `boolean`                | `true`    | If `true`, allows destructuring as `[data, ,]` to explicitly ignore the error element.                                                      |
| `checkWrappedCalls` | `boolean`                | `true`    | If `true`, uses the Type Checker to analyze calls to functions other than `tryCatch` to see if they return the expected branded tuple type. |

## Expected `tryCatch` Result Type (Branded Tuple)

The tooling relies on the `tryCatch` function returning a **branded tuple union** structure:

```typescript
interface TryCatchBrand {
  __tryCatchTupleResult: "marker"; // The unique brand property
}
type Success<T> = TryCatchBrand & [data: T, error: null];
type Failure<E> = TryCatchBrand & [data: null, error: E | Error];
export type Result<T, E = Error> = Success<T> | Failure<E>;
```

The presence of `__tryCatchTupleResult` is essential for the `checkWrappedCalls` feature.

## Validation Rules (Enforced by Tooling)

**Valid Usage:**

```typescript
// Standard
const [data, error] = tryCatch(...);
const [data, err] = await tryCatch(...);

// Using underscore for error
const [data, _] = tryCatch(...);

// Explicitly ignoring error (Valid by default because allowIgnoredError: true)
const [data, ,] = tryCatch(...);

// Wrapped calls (if checkWrappedCalls: true and type matches)
const wrapped = () => tryCatch(...);
const [d, e] = wrapped();
```

**Invalid Usage:**

```typescript
// Not destructured -> Error
const result = tryCatch(...);

// Missing elements -> Error (expects 2 positions)
const [data] = tryCatch(...);
const [] = tryCatch(...);

// Too many elements -> Error
const [data, error, extra] = tryCatch(...);

// Wrapped calls with incorrect destructuring -> Error (if checkWrappedCalls: true)
const wrapped = () => tryCatch(...);
const [d] = wrapped();
const res = await wrapped();
```

## Code Fixes (Language Service Plugin)

When an invalid pattern is detected:

1. **`Destructure return as [result, error]`**: Fixes to the standard pattern.
2. **`Destructure return as [result, ,] (ignore error)`**: (Only if `allowIgnoredError: true`) Fixes to the ignored error pattern.

---

## More `tryCatch` Examples & API

### Named Operations for Debugging

```ts
const [result, error] = tryCatch((): void => {
  throw new Error("Failed to fetch data");
}, "Fetch Data");

// error?.message -> "Operation \"Fetch Data\" failed: Failed to fetch data"
```

### Explicit Sync/Async

```ts
const [resSync, errSync] = tryCatch.sync(() => /* sync op */);
const [resAsync, errAsync] = await tryCatch.async(async () => /* async op */);
```

### Handling & Customizing Errors

If a non-Error is thrown, it's wrapped:

```ts
const [, error] = tryCatch(() => {
  throw "Oops";
});
// error is instance of Error, error.message is "Oops"
```

Specify expected error types:

```ts
type UserError = SyntaxError | NetworkError;

// Option 1: Manual types
const [user, error] = await tryCatch<Promise<User>, UserError>(fetchUser(1));
// error type: UserError | Error | null
// user type: User | null

// Option 2: .errors<E>() helper
const [user, error] = await tryCatch.errors<UserError>()(fetchUser(1));
// error type: UserError | Error | null
// user type: User (inferred from fetchUser) | null
```

### Wrapping Functions

```ts
const getUser = (id: number) =>
  tryCatch
    .errors<RangeError | SyntaxError>() // Chain errors
    .async(fetchUser(id)); // Use async helper if needed

async function main() {
  const [user, error] = await getUser(1);
  if (error) {
    // error type includes RangeError, SyntaxError, and base Error
    /* ... */
  }
}
```

### React Server Components (RSC) Example

```tsx
const getUser = (id: number) => tryCatch.errors<SpecificError>()(fetchUser(id));

async function UserPage({ id }: { id: number }) {
  const [user, error] = await getUser(id);

  if (error) {
    // Handle specific errors or show generic message
    if (error instanceof SpecificError)
      return <div>Specific error occurred</div>;
    return <div>User not found or error occurred.</div>;
  }

  return <div>Hello {user.name}!</div>;
}
```

### Comparison with `try...catch`

```ts
async function goodFunc() {
  if (false) throw "no data";
  return "some data";
}

async function badFunc() {
  if (true) throw "no data";
  return "some data";
}

// ✅ Using tryCatch
const getData = async () => {
  let [data, err] = await tryCatch(badFunc);
  if (!err) return Response.json({ data });

  [data, err] = await tryCatch(badFunc);
  if (!err) return Response.json({ data });

  [data, err] = await tryCatch(goodFunc);
  if (!err) return Response.json({ data });

  return Response.error();
};

// ✅ Using tryCatch with constants
const getDataConst = async () => {
  const [data1, err1] = await tryCatch(badFunc);
  if (!err1) return Response.json({ data: data1 });

  const [data2, err2] = await tryCatch(badFunc);
  if (!err2) return Response.json({ data: data2 });

  const [data3, err3] = await tryCatch(goodFunc);
  if (!err3) return Response.json({ data: data3 });

  return Response.error();
};

// ❌ Using traditional try...catch (deep nesting)
const getDataStandard = async () => {
  try {
    const data = await badFunc();
    return Response.json({ data });
  } catch (err) {
    try {
      const data = await badFunc();
      return Response.json({ data });
    } catch (err) {
      try {
        const data = await goodFunc();
        return Response.json({ data });
      } catch (err) {
        return Response.error();
      }
    }
  }
};
```

### API Reference

#### Main Function

```ts
tryCatch<T, E extends Error = never>(fn?: (() => T) | T | Promise<T> | (() => Promise<T>), operationName?: string): Result<T, E>
```

- Handles values, sync/async functions
- Automatically detects Promises

#### Explicit Synchronous Handling

```ts
tryCatch.sync<T, E extends Error = never>(fn: () => T, operationName?: string): Result<T, E>
```

#### Explicit Asynchronous Handling

```ts
tryCatch.async<T, E extends Error = never>(fn: Promise<T> | (() => Promise<T>), operationName?: string): Promise<Result<T, E>>
```

#### Result Type

```ts
type Result<T, E = Error> = ([data: T, error: null] | [data: null, error: E]) &
  TryCatchBrand;
```

### Edge Cases

```ts
tryCatch(undefined); // Returns [undefined, null]
tryCatch(null); // Returns [null, null]
tryCatch(() => {
  throw new Error("Unexpected Error");
}); // Returns [null, Error]
tryCatch(() => {
  throw null;
}); // Returns [null, Error]
tryCatch(Promise.reject(new Error("Promise rejected"))); // Handles rejected promises
```

## Development

```bash
# Install dependencies
bun install

# Build packages
bun run build

# Run tests
bun run test
```

## Contributions

Contributions of any kind are much appreciated.

<!-- Please refer to the contribution guidelines (TBD). -->

## License

[MIT](./LICENSE)
