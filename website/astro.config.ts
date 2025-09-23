import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import starlightChangelogs from "starlight-changelogs";

const redirects = import.meta.env.REDIRECTS
  ? JSON.parse(import.meta.env.REDIRECTS)
  : {};

// https://astro.build/config
export default defineConfig({
  site: "https://retuple.pages.dev",
  redirects,
  integrations: [
    starlight({
      title: "reTuple",
      tagline: "reTuple",
      description:
        "A TypeScript utility for Go-style structured error handling combined with powerful tooling.",
      logo: {
        // TODO: add dark and light logo variants
        // dark: './src/assets/logo-dark.svg',
        // light: './src/assets/logo-light.svg',
        src: "./src/assets/logo.svg",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/maxmorozoff/try-catch-tuple",
        },
      ],
      lastUpdated: true,
      editLink: {
        baseUrl:
          "https://github.com/maxmorozoff/try-catch-tuple/edit/main/website/",
      },
      customCss: [
        // Path to your Tailwind base styles:
        "./src/styles/global.css",
        "@fontsource/commit-mono",
        "@fontsource-variable/inter",
      ],

      plugins: [starlightChangelogs()],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
