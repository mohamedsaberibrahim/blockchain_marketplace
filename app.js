import Fastify from "fastify";
import registerSystemRoutes from "./routes/systemRoutes.js";
import registerMarketplaceRoutes from "./routes/marketplaceRoutes.js";

function buildApp() {
  const fastify = Fastify();
  fastify.decorate("marketplaceNode", null);

  registerSystemRoutes(fastify);
  registerMarketplaceRoutes(fastify);

  return fastify;
}

export default buildApp;
