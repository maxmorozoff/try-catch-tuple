import { describe, expect, test } from "bun:test";

import { tryCatch } from "../src/tryCatch";

describe("tryCatch", () => {
  describe("sync", () => {
    test("should return a Result with a primitive value", () => {
      const [result, error] = tryCatch(() => 73);
      expect(result).toBe(73);
      expect(error).toBeNil();
      if (error) {
        error satisfies Error;
        expect.unreachable();
      }
      error satisfies null;
    });

    test("should return a Result with an object", () => {
      const obj = { key: "value" };
      const [result, error] = tryCatch(() => obj);
      expect(result).toStrictEqual(obj);
      expect(error).toBeNil();
    });

    test("should catch a thrown string", () => {
      const [result, error] = tryCatch((): void => {
        throw "string error";
      });
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        error satisfies Error;
        expect(error.message).toBe("string error");
        return;
      }
      error satisfies null;
      expect.unreachable();
    });

    test("should catch a thrown number", () => {
      const [result, error] = tryCatch((): void => {
        throw 404;
      });
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toBe("404");
      }
    });

    test("should handle null return values", () => {
      const [result, error] = tryCatch(() => null);
      expect(result).toBeNull();
      expect(error).toBeNil();
    });

    test("should handle undefined return values", () => {
      const [result, error] = tryCatch(() => undefined);
      expect(result).toBeUndefined();
      expect(error).toBeNil();
    });
  });

  describe("tryCatch.async", () => {
    test("should return a Result with an async primitive value", async () => {
      const [result, error] = await tryCatch.async(() => Promise.resolve(73));
      expect(result).toBe(73);
      expect(error).toBeNil();
      if (error) {
        error satisfies Error;
        expect.unreachable();
      }
      error satisfies null;
    });

    test("should catch an async thrown error", async () => {
      const [result, error] = await tryCatch.async(async () => {
        throw new Error("async error");
      });
      expect(result).toBeNil();
      expect(error).not.toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        error satisfies Error;
        expect(error.message).toBe("async error");
        return;
      }
      error satisfies null;
      expect.unreachable();
    });

    test("should return a Result with an async primitive value", async () => {
      // @ts-expect-error number is not a promise
      const [promise, error] = await tryCatch.async(() => 73);
      const result = await promise;
      expect(result).toBe(73);
      expect(error).toBeNil();
      if (error) {
        error satisfies Error;
        expect.unreachable();
      }
      error satisfies null;
    });
  });

  describe("tryCatch.sync", () => {
    test("should return a Result with an async primitive value", async () => {
      const [result, error] = tryCatch.sync(() => 73);
      expect(result).toBe(73);
      expect(error).toBeNil();
      if (error) {
        error satisfies Error;
        expect.unreachable();
      }
      error satisfies null;
    });

    test("should catch an async thrown error", async () => {
      const [result, error] = tryCatch.sync(() => {
        throw new Error("async error");
      });
      expect(result).toBeNil();
      expect(error).not.toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        error satisfies Error;
        expect(error.message).toBe("async error");
        return;
      }
      error satisfies null;
      expect.unreachable();
    });

    test("should return a Result with an async primitive value", async () => {
      const [promise, error] = tryCatch.sync(() => Promise.resolve(73));
      const result = await promise;
      expect(result).toBe(73);
      expect(error).toBeNil();
      if (error) {
        error satisfies Error;
        expect.unreachable();
      }
      error satisfies null;
    });
  });

  describe("async", () => {
    test("should return a Result with an async primitive value", async () => {
      const [result, error] = await tryCatch(() => Promise.resolve(73));
      expect(result).toBe(73);
      expect(error).toBeNil();
      if (error) {
        error satisfies Error;
        expect.unreachable();
      }
      error satisfies null;
    });

    test("should catch an async thrown error", async () => {
      const [result, error] = await tryCatch(async () => {
        throw new Error("async error");
      });
      expect(result).toBeNil();
      expect(error).not.toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        error satisfies Error;
        expect(error.message).toBe("async error");
        return;
      }
      error satisfies null;
      expect.unreachable();
    });

    test("should return a Result with an async object", async () => {
      const obj = { key: "value" };
      const [result, error] = await tryCatch(() => Promise.resolve(obj));
      expect(result).toStrictEqual(obj);
      expect(error).toBeNil();
    });

    test("should catch an async rejected string", async () => {
      const [result, error] = await tryCatch(() =>
        Promise.reject("async string error"),
      );
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toBe("async string error");
      }
    });

    test("should catch an async rejected number", async () => {
      const [result, error] = await tryCatch(() => Promise.reject(500));
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toBe("500");
      }
    });

    test("should handle async null return values", async () => {
      const [result, error] = await tryCatch(() => Promise.resolve(null));
      expect(result).toBeNull();
      expect(error).toBeNil();
    });

    test("should handle async undefined return values", async () => {
      const [result, error] = await tryCatch(() => Promise.resolve(undefined));
      expect(result).toBeUndefined();
      expect(error).toBeNil();
    });
  });

  // Synchronous Division Tests
  describe("performDivision", () => {
    function performDivision(numerator: number, denominator: number) {
      return tryCatch(() => {
        if (denominator === 0) {
          throw new Error("Cannot divide by zero!");
        }
        return numerator / denominator;
      }, "Division Operation");
    }

    test("should return a successful division result", () => {
      const [result, error] = performDivision(10, 2);
      expect(result).toBe(5);
      expect(error).toBeNil();
    });

    test("should catch division by zero error", () => {
      const [result, error] = performDivision(10, 0);
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toContain("Cannot divide by zero!");
      }
    });
  });

  // Asynchronous Greeting Tests
  describe("delayedGreeting", () => {
    async function delayedGreeting(name: string, shouldFail: boolean) {
      return await tryCatch(
        () =>
          new Promise<string>((resolve, reject) => {
            setTimeout(() => {
              if (shouldFail) {
                reject(new Error("Greeting service unavailable!"));
              } else {
                resolve(`Hello, ${name}!`);
              }
            }, 100);
          }),
        "Greeting Task",
      );
    }

    test("should return a successful greeting", async () => {
      const [result, error] = await delayedGreeting("Alice", false);
      expect(error).toBeNil();
      expect(result).toBe("Hello, Alice!");
    });

    test("should catch a greeting failure", async () => {
      const [result, error] = await delayedGreeting("Bob", true);
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toContain("Greeting service unavailable!");
      }
    });
  });

  // JSON Parsing Tests
  describe("parseJsonString", () => {
    interface Person {
      name: string;
      age: number;
    }

    function parseJsonString(jsonString: string) {
      return tryCatch(() => JSON.parse(jsonString) as Person, "JSON Parsing");
    }

    test("should successfully parse valid JSON", () => {
      const [result, error] = parseJsonString('{"name": "Alice", "age": 30}');
      expect(error).toBeNil();
      expect(result).toStrictEqual({ name: "Alice", age: 30 });
    });

    test("should catch JSON parsing error on malformed JSON", () => {
      const [result, error] = parseJsonString('{"name": "Bob", "age": 25,');
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toContain("JSON Parse error");
      }
    });
  });

  // API Fetch Tests
  describe.skip("fetchUserData", () => {
    interface User {
      id: number;
      name: string;
      username: string;
      email: string;
    }

    async function fetchUserData(userId: number) {
      return tryCatch(async () => {
        const response = await fetch(
          `https://jsonplaceholder.typicode.com/users/${userId}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json()) as User;
      }, "Fetch User Data");
    }

    test("should successfully fetch a valid user", async () => {
      const [result, error] = await fetchUserData(1);
      expect(error).toBeNil();
      expect(result).not.toBeNil();
      if (result) {
        expect(result.id).toBe(1);
        expect(typeof result.name).toBe("string");
        expect(typeof result.email).toBe("string");
      }
    });

    test("should catch API fetch error for non-existent user", async () => {
      const [result, error] = await fetchUserData(999);
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toContain("HTTP error!");
      }
    });
  });

  describe("edge cases", () => {
    test("should handle undefined fn", () => {
      const [result, error] = tryCatch();
      expect(result).toBe(undefined);
      expect(error).toBeNil();
    });

    test("should handle null fn", () => {
      const [result, error] = tryCatch(null);
      expect(result).toBe(null);
      expect(error).toBeNil();
    });

    test("should handle Promise", async () => {
      const [result, error] = await tryCatch(Promise.resolve(73));
      expect(result).toBe(73);
      expect(error).toBeNil();
    });

    test("should handle chaining", async () => {
      const getData = () => {
        let [data, err] = tryCatch(() => {
          throw "no data";
          return "";
        });

        if (!err) return Response.json({ data });

        [data, err] = tryCatch(() => {
          if (false) throw "no data";
          return "some data";
        });

        if (!err) return Response.json({ data });

        return Response.error();
      };
      const result = getData();
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
      expect(await result.text()).toBe('{"data":"some data"}');
    });
  });

  describe("operationName", () => {
    test("should handle operationName", () => {
      const [result, error] = tryCatch((): void => {
        throw 404;
      }, "fetch");
      expect(result).toBeNil();
      expect(error).toBeInstanceOf(Error);
      if (error) {
        expect(error.message).toBe('Operation "fetch" failed: 404');
      }
    });
  });

  describe("handleError", () => {
    const now = new Date();
    test.each([
      ["string", "foo bar baz", "foo bar baz"],
      ["number", 73, "73"],
      ["NaN", Number.NaN, "NaN"],
      ["zero", 0, "0"],
      ["positive infinity", Number.POSITIVE_INFINITY, "Infinity"],
      ["negative infinity", Number.NEGATIVE_INFINITY, "-Infinity"],
      ["object", { foo: "bar" }, "[object Object]"],
      ["null", null, "null"],
      ["promise", new Promise(() => {}), "[object Promise]"],
      ["undefined", undefined, "undefined"],
      ["array", [1, 2, 3], "1,2,3"],
      ["function", function error() {}, String(function error() {})],
      ["arrow function", () => {}, String(() => {})],
      ["symbol", Symbol("symbol"), "Symbol(symbol)"],
      ["bigint", 123n, "123"],
      ["boolean", true, "true"],
      ["date", now, now.toString()],
      ["error", new Error("error"), "error"],
      ["aggregate error", new AggregateError([new Error()], "error"), "error"],
      ["regexp", /foo/g, "/foo/g"],
      ["buffer", Buffer.from([1, 2, 3]), "\u0001\u0002\u0003"],
      ["typed array", new Uint8Array([1, 2, 3]), "1,2,3"],
      ["array buffer", new ArrayBuffer(8), "[object ArrayBuffer]"],
      ["data view", new DataView(new ArrayBuffer(8)), "[object DataView]"],
      ["set", new Set([1, 2, 3]), "[object Set]"],
      ["map", new Map([[1, "a"]]), "[object Map]"],
      ["weak set", new WeakSet(), "[object WeakSet]"],
      ["weak map", new WeakMap(), "[object WeakMap]"],
    ] as const)("throwing %s [%#]", (type, value, valueString) => {
      const [, error] = tryCatch((): void => {
        throw value;
      }, `Throwing ${type}`);

      if (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(
          `Operation "Throwing ${type}" failed: ${valueString}`,
        );
        if (value instanceof Error) return;
        if (value === null) expect(error.cause).toBeNull();
        if (value === undefined) expect(error.cause).toBeUndefined();
        if (Number.isNaN(value)) expect(Number.isNaN(error.cause)).toBe(true);
        expect(error.cause).toBe(value);
      } else {
        expect.unreachable();
      }
    });
  });

  describe("CustomError", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    test("should handle multiple errors", () => {
      const [result, error] = tryCatch.errors<
        | CustomError
        | TypeError
        | SyntaxError
        | ReferenceError
        | WebTransportError
        | DOMException
      >()((): void => {
        throw new CustomError("[CustomError]");
      });

      expect(result).toBeNil();
      //     ^?
      expect(error).toBeInstanceOf(Error);
      //     ^?
      expect(error).toBeInstanceOf(CustomError);
      expect(error).not.toBeInstanceOf(TypeError);
      expect(error).not.toBeInstanceOf(SyntaxError);
      if (error) {
        error;
        // ^?
        if (error instanceof CustomError) {
          expect(error.message).toBe("[CustomError]");
          //     ^?
          return;
        }
        if (error instanceof DOMException) {
          expect(error.message).toBe("[DOMException]");
          //     ^?
          return;
        }
        if (error instanceof WebTransportError) {
          expect(error.message).toBe("[WebTransportError]");
          //     ^?
          return;
        }
        error;
        // ^?
        return;
      }
      result;
      // ^?
    });
  });
});
