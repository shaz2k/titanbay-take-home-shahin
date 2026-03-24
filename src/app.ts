import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerRootErrorHandler } from "./plugins/error-handler.js";
import { fundRoutes } from "./routes/funds.js";
import { investmentRoutes } from "./routes/investments.js";
import { investorRoutes } from "./routes/investors.js";

export type BuildAppOptions = {
  /** Set `false` in tests to silence request logs. */
  logger?: boolean;
};

export async function buildApp(options?: BuildAppOptions) {
  const app = Fastify({
    logger: options?.logger ?? true,
  });

  await app.register(cors, { origin: true });
  registerRootErrorHandler(app);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(fundRoutes);
  await app.register(investmentRoutes);
  await app.register(investorRoutes);

  return app;
}
