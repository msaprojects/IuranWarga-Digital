import eslint from "@eslint/js";
import globals from "globals";
import babelParser from "@babel/eslint-parser";

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", "src/prisma/contract.d.ts"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          plugins: ["@babel/plugin-syntax-typescript"],
        },
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
