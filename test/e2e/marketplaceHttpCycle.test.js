import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";

import buildApp from "../../app.js";
import Blockchain from "../../src/blockchain.js";
import MarketplaceNode from "../../src/marketplaceNode.js";

test("HTTP flow sells, buys, mines, and exposes expected blockchain state", async () => {
  const originalPost = axios.post;

  const app = buildApp();
  const blockchain = new Blockchain();
  blockchain.difficulty = 1;
  const nodeUrl = "http://localhost:3999";
  const node = new MarketplaceNode(nodeUrl, [], blockchain);
  app.marketplaceNode = node;

  axios.post = async (url, data) => {
    if (url === `${nodeUrl}/payment`) {
      node.balance += data.price;
    }
    return { status: 200 };
  };

  try {
    const sellResponse = await app.inject({
      method: "POST",
      url: "/sell",
      payload: { price: 30, songTitle: "Full Cycle Song" },
    });
    assert.equal(sellResponse.statusCode, 200);

    const availableResponse = await app.inject({
      method: "GET",
      url: "/available-songs",
    });
    assert.equal(availableResponse.statusCode, 200);
    const { songs } = availableResponse.json();
    assert.equal(songs.length, 1);

    const [songId] = songs[0];
    const buyResponse = await app.inject({
      method: "POST",
      url: "/buy",
      payload: { id: songId },
    });
    assert.equal(buyResponse.statusCode, 200);
    assert.equal(buyResponse.json().message, "Processed transaction");

    for (let i = 0; i < 3; i += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/sell",
        payload: { price: 10 + i, songTitle: `Extra Song ${i}` },
      });
      assert.equal(response.statusCode, 200);
    }

    assert.equal(node.blockchain.chain.length, 2);
    assert.equal(node.blockchain.pendingTransactions.length, 0);
    assert.equal(node.balance, 50100);
  } finally {
    axios.post = originalPost;
    await app.close();
  }
});
