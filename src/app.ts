import Fastify from "fastify";
import cors from "@fastify/cors";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { fundRoutes } from "./routes/funds.js";
import { investmentRoutes } from "./routes/investments.js";
import { investorRoutes } from "./routes/investors.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(errorHandlerPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(fundRoutes);
  await app.register(investmentRoutes);
  await app.register(investorRoutes);

  return app;
}
