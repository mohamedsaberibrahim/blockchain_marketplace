function registerSystemRoutes(fastify) {
  fastify.get("/", async (request, reply) => {
    reply.send({ message: "Marketplace running" });
  });
}

export default registerSystemRoutes;
