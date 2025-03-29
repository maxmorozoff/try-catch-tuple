import { tryCatch } from "@maxmorozoff/try-catch-tuple";

{
  const [user, error] = tryCatch(parseUserJson('{"id":1}')); // ok
}
{
  const [user, ,] = tryCatch(parseUserJson('{"id":1}')); // ok
}
{
  const [user] = tryCatch(parseUserJson('{"id":1}'));
}
{
  const wrappedTryCatch = () => tryCatch(parseUserJson('{"id":1}'));
  const [user] = wrappedTryCatch();
}
{
  const wrappedTryCatch = () => tryCatch(fetchMeUser);
  const user = await wrappedTryCatch();
}

{
  const [result] = await tryCatch(fetchMeUser);
}
{
  const result = tryCatch(() => null);
}
function foo() {
  const result = tryCatch(() => null);
}
const bar = () => {
  const result = tryCatch(() => null);
};
// const data = tryCatch(() => null);
// let data1 = tryCatch(() => null);
// export const result = tryCatch(() => null);

{
  {
    const [result] = tryCatch(() => null);
  }
  {
    // biome-ignore lint/complexity/noUselessLoneBlockStatements:
    // biome-ignore lint/style/noVar:
    // biome-ignore lint/correctness/noInnerDeclarations:
    var [result] = tryCatch(() => null);
  }
  {
    // biome-ignore lint/style/useSingleVarDeclarator:
    const foo = "bar",
      [result] = tryCatch(() => null);
  }
  {
    const wrappedTryCatch = () => tryCatch(() => null);
    const [result] = wrappedTryCatch();
  }
  {
    const wrappedTryCatch = () => tryCatch(async () => null);
    const [result] = await wrappedTryCatch();
  }
  {
    const [result] = await tryCatch(async () => null);
  }
  {
    const result = tryCatch(() => null);
  }
  function foo() {
    const result = tryCatch(() => null);
  }
  const bar = () => {
    const result = tryCatch(() => null);
  };
  const data = tryCatch(() => null);
  // biome-ignore lint/style/useConst: <explanation>
  let data1 = tryCatch(() => null);
  const result = tryCatch(() => null);
}

type User = { id: number };
async function fetchMeUser() {
  return {} as User;
}
function parseUserJson(jsonString: string) {
  return () => JSON.parse(jsonString) as User;
}
