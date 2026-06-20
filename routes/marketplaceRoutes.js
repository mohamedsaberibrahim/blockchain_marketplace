import Blockchain from "../src/blockchain.js";

function getMarketplaceNode(reply, server) {
  if (!server.marketplaceNode) {
    reply.code(503).send({ message: "Node not initialized yet" });
    return null;
  }

  return server.marketplaceNode;
}

function registerMarketplaceRoutes(fastify) {
  fastify.post("/register-node", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const { url: newNodeUrl } = request.body;
    await marketplaceNode.registerNode(newNodeUrl);
    reply.send({ message: "Node Registered" });
  });

  fastify.post("/sync-peers", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const { peers } = request.body;
    marketplaceNode.peers = peers;
    console.log(`${marketplaceNode.url} synced ${marketplaceNode.peers}`);
    reply.send({ message: "Synced Peers" });
  });

  fastify.post("/sync-blockchain", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const { chain } = request.body;
    marketplaceNode.blockchain = new Blockchain(
      chain,
      marketplaceNode.blockchain.pendingTransactions
    );
    reply.send({ message: "Blockchain synced", blockCount: chain.length });
  });

  fastify.post("/payment", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const { price } = request.body;
    marketplaceNode.balance += price;
    reply.send({ message: `New balance ${marketplaceNode.balance}` });
  });

  fastify.post("/sell", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const { price, songTitle } = request.body;
    await marketplaceNode.processTransaction({
      price,
      songTitle,
      sender: marketplaceNode.url,
      type: "SELL",
    });
    reply.send({ message: "Song being listed" });
  });

  fastify.post("/buy", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const { id } = request.body;
    const transaction = marketplaceNode.songs[id];
    if (!transaction) {
      return reply.send({ message: "No song exists by that id" });
    }

    const result = await marketplaceNode.processTransaction({
      id: transaction.id,
      price: transaction.price,
      songTitle: transaction.songTitle,
      expiration: transaction.expiration,
      recipient: transaction.sender,
      sender: marketplaceNode.url,
      type: "BUY",
    });
    reply.send({ message: result });
  });

  fastify.get("/available-songs", async (request, reply) => {
    const marketplaceNode = getMarketplaceNode(reply, request.server);
    if (!marketplaceNode) return;

    const songs = marketplaceNode.availableSongs();
    reply.send({ songs });
  });
}

export default registerMarketplaceRoutes;
