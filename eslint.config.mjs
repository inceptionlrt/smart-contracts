import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginChaiFriendly from "eslint-plugin-chai-friendly";

export default defineConfig(
  [
    { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.browser } },
    tseslint.configs.recommended,
    {
      plugins: { "chai-friendly": pluginChaiFriendly },
      rules: {
        "@typescript-eslint/no-unused-expressions": "off",
        "chai-friendly/no-unused-expressions": "error",

        //! TODO: remove later all the items below
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "no-empty": "off",
      },
    },
  ],
  globalIgnores([
    "projects/vaults/typechain-types",
    "projects/vaults/coverage",
    "projects/vaults/.solcover.js",

    //! TODO: remove later after fix all the items below
    "projects/vaults/scripts",
    "projects/vaults/tasks",
    "projects/airdrop",
    "projects/restaking-pool",
    "projects/timelocks",
  ]),
);
