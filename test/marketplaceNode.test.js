import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";

import Blockchain from "../src/blockchain.js";
import MarketplaceNode from "../src/marketplaceNode.js";

test("SELL -> BUY updates balances and stores song", async () => {
  const originalPost = axios.post;
  const calls = [];
  axios.post = async (url, data) => {
    calls.push({ url, data });
    return { status: 200 };
  };

  try {
    const chain = new Blockchain();
    const node = new MarketplaceNode("http://localhost:3001", [], chain);

    const sellResult = await node.processTransaction({
      id: "song-1",
      type: "SELL",
      songTitle: "Nebula",
      price: 100,
      sender: "http://localhost:3000",
    });

    assert.equal(sellResult, "Processed transaction");
    assert.equal(node.availableSongs().length, 1);

    const buyResult = await node.processTransaction({
      id: "song-1",
      type: "BUY",
      songTitle: "Nebula",
      price: 100,
      sender: "http://localhost:3001",
      recipient: "http://localhost:3000",
    });

    assert.equal(buyResult, "Processed transaction");
    assert.equal(node.balance, 49900);
    assert.equal(node.songs["song-1"].type, "BUY");
    assert.deepEqual(calls[0], {
      url: "http://localhost:3000/payment",
      data: { price: 100 },
    });
  } finally {
    axios.post = originalPost;
  }
});

test("MINE reward increases balance and appends a block", async () => {
  const originalPost = axios.post;
  axios.post = async () => ({ status: 200 });

  try {
    const chain = new Blockchain();
    chain.difficulty = 1;
    const node = new MarketplaceNode("http://localhost:3001", ["http://localhost:3000"], chain);

    for (let i = 0; i < 5; i += 1) {
      await node.processTransaction({
        id: `song-${i}`,
        type: "SELL",
        songTitle: `Track ${i}`,
        price: 10 + i,
        sender: node.url,
      });
    }

    assert.equal(node.balance, 50100);
    assert.equal(node.blockchain.chain.length, 2);
    assert.equal(node.blockchain.pendingTransactions.length, 0);
  } finally {
    axios.post = originalPost;
  }
});
