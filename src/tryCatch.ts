type Success<T> = [data: T, error: null];
type Failure<E> = [data: null, error: E];
type Result<T, E = Error> = Success<T> | Failure<E>;

type TryCatchReturn<T> = T extends Promise<infer U>
  ? Promise<Result<U, Error>>
  : Result<T, Error>;

/**
 * tryCatch - Error handling that can be synchronous or asynchronous
 * based on the input function.
 *
 * @param fn Function to execute, Promise or value.
 * @param operationName Optional name for context.
 * @returns A Result, or a Promise resolving to a Result, depending on fn.
 */
export function tryCatch<T>(
  fn?: T | (() => T),
  operationName?: string,
): TryCatchReturn<T> {
  try {
    const result = typeof fn === "function" ? (fn as () => T)() : fn;

    if (result instanceof Promise)
      return result
        .then((data) => [data, null])
        .catch((rawError) =>
          handleError(rawError, operationName),
        ) as TryCatchReturn<T>;

    return [result, null] as TryCatchReturn<T>;
  } catch (rawError) {
    return handleError(rawError, operationName) as TryCatchReturn<T>;
  }
}
tryCatch.sync = tryCatchSync;
tryCatch.async = tryCatchAsync;

export function tryCatchSync<T>(
  fn: () => T,
  operationName?: string,
): Result<T, Error> {
  try {
    const result = fn();
    return [result, null] as const;
  } catch (rawError) {
    return handleError(rawError, operationName);
  }
}

export async function tryCatchAsync<T>(
  fn: Promise<T> | (() => Promise<T>),
  operationName?: string,
): Promise<Result<T, Error>> {
  try {
    const promise = typeof fn === "function" ? fn() : fn;
    const data = await promise;
    return [data, null] as const;
  } catch (rawError) {
    return handleError(rawError, operationName);
  }
}

function handleError(rawError: unknown, operationName?: string) {
  const processedError =
    rawError instanceof Error ? rawError : new Error(String(rawError));

  if (operationName) {
    processedError.message = `Operation "${operationName}" failed: ${processedError.message}`;
  }

  return [null, processedError] as Failure<typeof processedError>;
}
