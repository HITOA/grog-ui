import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs["flat/recommended"],
    prettier,
    ...svelte.configs["flat/prettier"],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
            },
        },
    },
    {
        rules: {
            // The codebase currently uses namespaces (e.g. the `API` namespace).
            // Modern style prefers plain ES modules (`import * as API from "./api"`),
            // so keep this as a nudge (warning) rather than a hard error for now.
            "@typescript-eslint/no-namespace": "warn",
        },
    },
    {
        ignores: ["dist/", "build/", "node_modules/"],
    },
);
