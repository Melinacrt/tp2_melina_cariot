import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", ".opencode/node_modules/"] },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    extends: [tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
);
