import { beforeEach, describe, expect, it } from "bun:test";
// import t from "ts-patch/compiler";
import { $ } from "bun";

describe("transformer", () => {
  beforeEach(async () => {
    await $`rm -rf ./out`;
  });
  it("should work", async () => {
    console.log(
      "Running test:types",
      await $`pwd`.text(), // /tmp
    );
    const result = await $`bun run test:types`.nothrow().quiet().text();

    expect(result).toMatchSnapshot();
  });
});
