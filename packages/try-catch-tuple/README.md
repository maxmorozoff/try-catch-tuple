# tryCatch Utility

A TypeScript utility function for structured error handling in both synchronous and asynchronous operations.

See [Theo's gist for more details](https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b)

## Features

- Handles both synchronous and asynchronous functions.
- Returns a structured tuple `[data, error]`.
- Provides named operations for better debugging.
- Includes `tryCatch.sync` and `tryCatch.async` for explicit handling.
- Allows custom error types via `.errors<E>()`
- Ensures all thrown values become `Error` instances

## Installation

```sh
npm install @maxmorozoff/try-catch-tuple
```

## Usage

### Basic Synchronous Usage

```ts
import { tryCatch } from "@maxmorozoff/try-catch-tuple";

function main() {
  const [result, error] = tryCatch(() => JSON.parse("73") as number);
  //     ^? const result: number | null

  if (!error) return result; // ✅ result: number
  console.log(error); // ❌ Error
  //          ^? const error: Error
}
```

### Named Operations for Debugging

```ts
const [result, error] = tryCatch((): void => {
  throw new Error("Failed to fetch data");
}, "Fetch Data");

console.log(error?.message); // "Operation \"Fetch Data\" failed: Failed to fetch data"
```

### Using `tryCatch.sync`

```ts
function main() {
  const [result, error] = tryCatch.sync(() => JSON.parse("73") as number);
  //     ^? const result: number | null
  if (!error) return result;
  //                 ^? const result: number
  error;
  // ^? const error: Error
  result;
  // ^? const result: null
}
```

### Using `tryCatch.async`

```ts
async function main() {
  const [result, error] = await tryCatch.async(
    //   ^? const result: number | null
    async () => JSON.parse("73") as number
  );
  if (!error) return result;
  //                 ^? const result: number
  error;
  // ^? const error: Error
  result;
  // ^? const result: null
}
```

### Handling Errors

#### Ensuring All Thrown Values Are Error Instances

If a thrown value is **not an instance of** `Error`, it gets wrapped:

```ts
const [result, error] = tryCatch((): void => {
  throw "Something went wrong";
});

console.log(error.message); // "Something went wrong"
//          ^? const error: Error

const [data, nullError] = tryCatch((): void => {
  throw null;
});

console.log(nullError.message); // "null"
//          ^? const error: Error
console.log(nullError.cause); // null
```

This ensures tryCatch always provides a proper error object.

#### Extending Error types

##### Option 1: Manually Set Result and Error Type

```ts
type User = { id: number; name: string };

async function main() {
  const [user, error] = await tryCatch<Promise<User>, SyntaxError>(
    fetchUser(1)
  );

  if (!error) return user; // ✅ user: User
  console.error(error); // ❌ SyntaxError | Error
}
```

##### Option 2: Using `tryCatch.errors<E>()` Helper

```ts
async function main() {
  const [user, error] = await tryCatch.errors<SyntaxError>()(fetchUser(1));

  if (!error) return user; // ✅ user: User
  console.error(error); // ❌ Error | SyntaxError
}
```

### Wrapping Functions for Reuse

To avoid repetitive tryCatch calls, you can wrap functions:

```ts
const getUser = (id: number) =>
  tryCatch
    .errors<RangeError>()
    .errors<SyntaxError | TypeError | DOMException>()
    .async(fetchUser(id));

// Or simply:
// const getUser = (id: number) => tryCatch(fetchUser(id));

async function main() {
  const [user, error] = await getUser(1);

  if (!error) return user; // ✅ user: User
  console.error(error); // ❌ Error | RangeError | SyntaxError | TypeError | DOMException
}
```

### Using in React Server Components (RSC)

```tsx
const getUser = (id: number) =>
  tryCatch.errors<SyntaxError | TypeError | DOMException>()(fetchUser(id));

async function UserPage({ id }: { id: number }) {
  const [user, error] = await getUser(id);

  if (!error) return <div>Hello {user.name}!</div>;

  if (error instanceof SyntaxError) {
    return <div>Error: {error.message}</div>;
  }

  return <div>Not found</div>;
}
```

### Comparing `tryCatch` with `try...catch`

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

## API Reference

### Main Function

```ts
tryCatch<T, E extends Error = never>(fn?: (() => T) | T | Promise<T> | (() => Promise<T>), operationName?: string): Result<T, E>
```

- Handles values, sync/async functions
- Automatically detects Promises

### Explicit Synchronous Handling

```ts
tryCatch.sync<T, E extends Error = never>(fn: () => T, operationName?: string): Result<T, E>
```

### Explicit Asynchronous Handling

```ts
tryCatch.async<T, E extends Error = never>(fn: Promise<T> | (() => Promise<T>), operationName?: string): Promise<Result<T, E>>
```

## Result Type

```ts
type Result<T, E = Error> = [data: T, error: null] | [data: null, error: E];
```

## Edge Cases

```ts
tryCatch(undefined); // Returns [undefined, null]
tryCatch(null); // Returns [null, null]
tryCatch(() => {
  throw new Error("Unexpected Error");
}); // Returns [null, Error]
tryCatch(Promise.reject(new Error("Promise rejected"))); // Handles rejected promises
```

## Tests

Extensive tests are provided using Bun.

```sh
bun test
```

## License

MIT
