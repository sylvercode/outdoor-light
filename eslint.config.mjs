import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";

export default [
    {
        ignores: [
            "dist/**",
            "foundry/**",
            "node_modules/**"
        ]
    },
    js.configs.recommended,
    {
        files: ["**/*.{ts,mts,cts,d.ts}"],
        languageOptions: {
            parser: babelParser,
            parserOptions: {
                requireConfigFile: false,
                babelOptions: {
                    presets: ["@babel/preset-typescript"]
                }
            }
        }
    }
];
