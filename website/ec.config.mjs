import { defineEcConfig } from "@astrojs/starlight/expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import ecTwoSlash from "expressive-code-twoslash";

export default defineEcConfig({
  themes: ["catppuccin-latte", "catppuccin-mocha"],
  plugins: [
    pluginLineNumbers(),
    ecTwoSlash({
      explicitTrigger: true,
      languages: ["ts", "tsx", "js", "jsx"],
    }),
  ],
  defaultProps: {
    // Disable line numbers by default
    showLineNumbers: false,
    // But enable line numbers for certain languages
    // overridesByLang: {
    //   'js,ts,html': {
    //     showLineNumbers: true,
    //   },
    // },
  },
});
