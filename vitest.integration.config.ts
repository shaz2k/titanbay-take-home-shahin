import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env" });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    poolOptions: {
      threads: { singleThread: true },
    },
  },
});
