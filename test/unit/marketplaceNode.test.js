import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";

import Blockchain from "../../src/blockchain.js";
import MarketplaceNode from "../../src/marketplaceNode.js";

test("registerNode adds peer and broadcasts updated peer list to existing peers", async () => {
  const originalPost = axios.post;
  const calls = [];
  axios.post = async (url, data) => {
    calls.push({ url, data });
    return { status: 200 };
  };

  try {
    const node = new MarketplaceNode(
      "http://localhost:3001",
      ["http://localhost:3000"],
      new Blockchain()
    );

    calls.length = 0;
    await node.registerNode("http://localhost:3002");

    assert.deepEqual(node.peers, ["http://localhost:3000", "http://localhost:3002"]);
    assert.deepEqual(calls, [
      {
        url: "http://localhost:3000/sync-peers",
        data: { peers: ["http://localhost:3000", "http://localhost:3002"] },
      },
      {
        url: "http://localhost:3002/sync-peers",
        data: { peers: ["http://localhost:3000", "http://localhost:3002"] },
      },
    ]);
  } finally {
    axios.post = originalPost;
  }
});

test("processTransaction rejects BUY when node balance is lower than price", async () => {
  const originalPost = axios.post;
  axios.post = async () => ({ status: 200 });

  try {
    const node = new MarketplaceNode("http://localhost:3001", [], new Blockchain());
    node.balance = 10;

    const result = await node.processTransaction({
      id: "song-1",
      type: "BUY",
      sender: "http://localhost:3001",
      recipient: "http://localhost:3000",
      price: 25,
    });

    assert.equal(result, "Insufficient balance");
    assert.equal(node.balance, 10);
    assert.equal(node.blockchain.pendingTransactions.length, 0);
  } finally {
    axios.post = originalPost;
  }
});

test("processing five SELL transactions triggers mining reward and appends a new block", async () => {
  const originalPost = axios.post;
  axios.post = async () => ({ status: 200 });

  try {
    const blockchain = new Blockchain();
    blockchain.difficulty = 1;
    const node = new MarketplaceNode("http://localhost:3001", ["http://localhost:3000"], blockchain);

    for (let i = 0; i < 5; i += 1) {
      await node.processTransaction({
        id: `song-${i}`,
        type: "SELL",
        songTitle: `Track ${i}`,
        sender: node.url,
        price: 15 + i,
      });
    }

    assert.equal(node.blockchain.chain.length, 2);
    assert.equal(node.blockchain.pendingTransactions.length, 0);
    assert.equal(node.balance, 50100);
  } finally {
    axios.post = originalPost;
  }
});
