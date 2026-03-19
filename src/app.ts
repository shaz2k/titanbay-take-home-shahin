import Fastify from "fastify";
import cors from "@fastify/cors";
import { errorHandlerPlugin } from "./plugins/error-handler.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(errorHandlerPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
