import buildApp from "./app.js";
import MarketplaceNode from "./src/marketplaceNode.js";
import Blockchain from "./src/blockchain.js";

let [PORT] = process.argv.slice(2);
const fastify = buildApp();
const blockchain = new Blockchain();
PORT = PORT || 0;

await fastify.listen({ port: PORT });
PORT = fastify.server.address().port;
const URL = `http://localhost:${PORT}`;
const initialPeers = ["http://localhost:3000"];

fastify.marketplaceNode = new MarketplaceNode(URL, initialPeers, blockchain);

console.log(`Running on http://localhost:${PORT}`);
