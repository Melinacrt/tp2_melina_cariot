import { defineConfig } from "vitest/config";

// Les tests vivent en *.spec.ts (convention) et *.test.ts (historique).
// Les deux sont exécutés — exclure l'un des deux masque des tests.
export default defineConfig({
  test: {
    include: ["test/**/*.spec.ts", "test/**/*.test.ts"],
    environment: "node"
  }
});
