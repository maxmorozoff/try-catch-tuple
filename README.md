# tryCatch Utility

A TypeScript utility function for structured error handling in both synchronous and asynchronous operations.

See [Theo's gist for more details](https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b)

## Features

- Handles both synchronous and asynchronous functions.
- Returns a structured tuple `[data, error]`.
- Provides named operations for better debugging.
- Includes `tryCatch.sync` and `tryCatch.async` for explicit handling.

## Installation

```sh
npm install @maxmorozoff/try-catch-tuple
```

## Usage

### Basic Synchronous Usage

```ts
import { tryCatch } from "@maxmorozoff/try-catch-tuple";

const [result, error] = tryCatch.sync(() => JSON.parse("73"));
console.log(result); // 73
console.log(error); // null
```

### Handling Errors

```ts
const [result, error] = tryCatch((): void => {
  throw new Error("Something went wrong");
});

console.log(result); // null
console.log(error?.message); // "Something went wrong"
```

### Asynchronous Usage with Errors

```ts
const [result, error] = await tryCatch(async () => {
  throw new Error("Network request failed");
});

console.log(result); // null
console.log(error?.message); // "Network request failed"
```

### Named Operations for Debugging

```ts
const [result, error] = tryCatch(() => {
  throw new Error("Failed to fetch data");
}, "Fetch Data");

console.log(error?.message); // "Operation \"Fetch Data\" failed: Failed to fetch data"
```

### Using `tryCatch.sync`

```ts
const [result, error] = tryCatch.sync(() => JSON.parse("INVALID_JSON"));
console.log(result); // null
console.log(error?.message); // "Unexpected token I in JSON"
```

### Using `tryCatch.async`

```ts
const [result, error] = await tryCatch.async(async () => {
  throw new Error("Async operation failed");
});

console.log(result); // null
console.log(error?.message); // "Async operation failed"
```

### Comparing `tryCatch` with `try...catch`

```ts
async function goodFunc() {
  if (false) throw "no data";
  return "some data";
}

async function badFunc() {
  throw "no data";
  return "";
}

// Using tryCatch
const getData = async () => {
  let [data, err] = await tryCatch(badFunc);
  if (!err) return Response.json({ data });

  [data, err] = await tryCatch(badFunc);
  if (!err) return Response.json({ data });

  [data, err] = await tryCatch(goodFunc);
  if (!err) return Response.json({ data });

  return Response.error();
};

// Using tryCatch with constants
const getDataConst = async () => {
  const [data1, err1] = await tryCatch(badFunc);
  if (!err1) return Response.json({ data: data1 });

  const [data2, err2] = await tryCatch(badFunc);
  if (!err2) return Response.json({ data: data2 });

  const [data3, err3] = await tryCatch(goodFunc);
  if (!err3) return Response.json({ data: data3 });

  return Response.error();
};

// Using try...catch
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

## API Reference

### `tryCatch<T>(fn: (() => T) | T, operationName?: string): Result<T>`

Handles both values and functions that may throw errors.

### `tryCatch.sync<T>(fn: () => T, operationName?: string): Result<T>`

Explicitly handles synchronous operations.

### `tryCatch.async<T>(fn: Promise<T> | (() => Promise<T>), operationName?: string): Promise<Result<T>>`

Explicitly handles asynchronous operations.

## Result Type

```ts
type Result<T, E = Error> = [data: T | null, error: E | null];
```

## Edge Cases

```ts
tryCatch(); // Returns [undefined, null]
tryCatch(null); // Returns [null, null]
tryCatch(() => {
  throw new Error("Unexpected Error");
}); // Handles thrown errors
tryCatch(Promise.reject(new Error("Promise rejected"))); // Handles rejected promises
```

## Tests

Extensive tests are provided using Bun.

```sh
bun test
```

## License

MIT
