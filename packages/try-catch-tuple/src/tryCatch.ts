type Branded<T> = T & { __tryCatchTupleResult: never };
type DisableArrayMethods<T> = T & {
  [K in Exclude<keyof Array<any>, "length" | symbol>]: never;
};

type DataErrorTuple<T, E> = Branded<
  DisableArrayMethods<[data: T, error: E] & never[]>
>;

/**
 * Represents a successful result where `data` is present and `error` is `null`.
 */
export type Success<T> = DataErrorTuple<T, null>;

/**
 * Represents a failure result where `error` contains an error instance and `data` is `null`.
 */
export type Failure<E extends Error> = DataErrorTuple<null, E | Error>;

/**
 * Represents the result of an operation that can either succeed with `T` or fail with `E`.
 */
export type Result<T, E extends Error> = Success<T> | Failure<E>;

/**
 * Resolves the return type based on whether `T` is a promise:
 * - If `T` is a `Promise<U>`, returns `Promise<Result<U, E>>`.
 * - Otherwise, returns `Result<T, E>`.
 */
export type TryCatchResult<T, E extends Error> = T extends Promise<infer U>
  ? Promise<Result<U, E>>
  : Result<T, E>;

/**
 * Function type for handling try-catch logic.
 *
 * @template E_ Default error type.
 * @template T The return type of the function being executed.
 * @template E The error type that extends the default error type.
 *
 * @param fn A function, promise, or value to execute within a try-catch block.
 * @param operationName Optional name added to `error.message` for better debugging and context.
 */
export type TryCatchFunc<E_ extends Error = Error> = <T, E extends Error = E_>(
  fn: T | (() => T),
  operationName?: string,
) => TryCatchResult<T, E>;

/**
 * A utility for handling synchronous and asynchronous operations within a try-catch block.
 *
 * @template F The function type for try-catch execution.
 * @template E_ The base error type.
 */
export type TryCatch<
  F extends TryCatchFunc = TryCatchFunc,
  E_ extends Error = Error,
> = F & {
  /**
   * Executes a synchronous function inside a try-catch block.
   *
   * @param fn The function to execute.
   * @param operationName Optional name added to `error.message` for better debugging and context.
   * @returns A `Result<T, E>` indicating success or failure.
   */
  sync: <T, E extends Error = E_>(
    fn: () => T,
    operationName?: string,
  ) => Result<T, E>;

  /**
   * Executes an asynchronous function inside a try-catch block.
   *
   * @param fn The function or promise to execute.
   * @param operationName Optional name added to `error.message` for better debugging and context.
   * @returns A `Promise<Result<T, E>>` indicating success or failure.
   */
  async: <T, E extends Error = E_>(
    fn: Promise<T> | (() => Promise<T>),
    operationName?: string,
  ) => Promise<Result<T, E>>;

  /**
   * Creates a new `TryCatch` instance that handles additional error types.
   *
   * @template E Extends the existing error type.
   * @returns A new `TryCatch` instance with extended error handling capabilities.
   */
  errors: <E extends Error>() => TryCatch<TryCatchFunc<E | E_>, E | E_>;
};

/**
 * tryCatch - Error handling that can be synchronous or asynchronous
 * based on the input function.
 *
 * @param fn A function, promise, or value to execute within a try-catch block.
 * @param operationName Optional name added to `error.message` for better debugging and context.
 * @returns A Result, or a Promise resolving to a Result, depending on fn.
 */
export const tryCatch: TryCatch = <T, E extends Error = Error>(
  fn: T | (() => T),
  operationName?: string,
) => {
  try {
    const result = typeof fn === "function" ? (fn as () => T)() : fn;

    if (result instanceof Promise)
      return tryCatchAsync(result, operationName) as TryCatchResult<T, E>;

    return [result, null] as TryCatchResult<T, E>;
  } catch (rawError) {
    return handleError(rawError, operationName) as TryCatchResult<T, E>;
  }
};

export const tryCatchSync: TryCatch["sync"] = <T, E extends Error = Error>(
  fn: () => T,
  operationName?: string,
) => {
  try {
    const result = fn();
    return [result, null] as Result<T, E>;
  } catch (rawError) {
    return handleError(rawError, operationName);
  }
};

export const tryCatchAsync: TryCatch["async"] = async <
  T,
  E extends Error = Error,
>(
  fn: Promise<T> | (() => Promise<T>),
  operationName?: string,
) => {
  try {
    const promise = typeof fn === "function" ? fn() : fn;
    const result = await promise;
    return [result, null] as Result<Awaited<T>, E>;
  } catch (rawError) {
    return handleError(rawError, operationName);
  }
};

export const tryCatchErrors = <E extends Error>() =>
  tryCatch as TryCatch<TryCatchFunc<E>, E>;

tryCatch.sync = tryCatchSync;
tryCatch.async = tryCatchAsync;
tryCatch.errors = tryCatchErrors;

// Handles a raw unknown error, ensures it's wrapped and annotated
function handleError(rawError: unknown, operationName?: string) {
  const processedError = isError(rawError)
    ? rawError
    : new Error(String(rawError), { cause: rawError });

  if (operationName) {
    annotateErrorMessage(processedError, operationName);
  }

  return [null, processedError] as Failure<typeof processedError>;
}

// Utility to prefix error messages with operation context
function annotateErrorMessage<E extends Error>(
  error: E,
  operationName: string,
): void {
  error.message = `Operation "${operationName}" failed: ${error.message}`;
}

// Type guards
function isError(error: unknown): error is Error {
  if (!error) return false;
  return Error?.isError?.(error) ?? error instanceof Error;
}
