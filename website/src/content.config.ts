import path from "node:path";
import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { changelogsLoader } from "starlight-changelogs/loader";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      {
        provider: "changeset",
        base: "changelog/try-catch-tuple",
        changelog: path.resolve("../packages/try-catch-tuple/CHANGELOG.md"),
      },
      {
        provider: "changeset",
        base: "changelog/ts-plugin",
        changelog: path.resolve("../packages/ts-plugin/CHANGELOG.md"),
      },
    ]),
  }),
};
