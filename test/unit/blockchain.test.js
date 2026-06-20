import test from "node:test";
import assert from "node:assert/strict";

import Blockchain from "../../src/blockchain.js";
import Transaction from "../../src/transaction.js";

test("Blockchain initializes with a genesis block when no chain is provided", () => {
  const blockchain = new Blockchain();

  assert.equal(blockchain.chain.length, 1);
  assert.equal(blockchain.chain[0].previousHash, null);
  assert.deepEqual(blockchain.chain[0].transactions, []);
});

test("mineBlock appends a mined block, links hashes, and clears pending transactions", async () => {
  const blockchain = new Blockchain();
  blockchain.difficulty = 1;

  const pending = new Transaction({
    id: "tx-1",
    type: "SELL",
    sender: "http://localhost:3001",
    songTitle: "Aurora",
    price: 20,
  });
  blockchain.pendingTransactions.push(pending);

  const previousBlock = blockchain.chain[0];

  await blockchain.mineBlock();

  assert.equal(blockchain.chain.length, 2);
  assert.equal(previousBlock.nextHash, blockchain.chain[1].hash);
  assert.equal(blockchain.chain[1].previousHash, previousBlock.hash);
  assert.deepEqual(blockchain.chain[1].transactions, [pending]);
  assert.deepEqual(blockchain.pendingTransactions, []);
});
