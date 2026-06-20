import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "crypto";

import Transaction from "../../src/transaction.js";

test("Transaction normalizes BUY payload and computes hash when hash is not provided", () => {
  const data = {
    id: "tx-buy-1",
    timestamp: 1710000000000,
    type: "buy",
    sender: "http://localhost:3001",
    recipient: "http://localhost:3000",
    songTitle: "Midnight Lane",
    artist: "Ava",
    price: "45",
  };

  const transaction = new Transaction(data);

  const expectedHash = createHash("sha256")
    .update(
      transaction.id +
        transaction.timestamp +
        transaction.type +
        transaction.sender +
        transaction.recipient +
        transaction.songTitle +
        transaction.artist +
        transaction.price
    )
    .digest("hex");

  assert.equal(transaction.type, "BUY");
  assert.equal(transaction.price, 45);
  assert.equal(transaction.receiver, transaction.recipient);
  assert.equal(transaction.hash, expectedHash);
});

test("Transaction preserves an incoming hash and supports receiver as recipient alias", () => {
  const transaction = new Transaction({
    id: "tx-sell-1",
    type: "SELL",
    sender: "http://localhost:3000",
    receiver: "http://localhost:3002",
    hash: "existing-hash",
  });

  assert.equal(transaction.hash, "existing-hash");
  assert.equal(transaction.recipient, "http://localhost:3002");
  assert.equal(transaction.receiver, "http://localhost:3002");
});
