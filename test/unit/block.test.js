import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "crypto";

import Block from "../../src/block.js";

test("Block constructor computes hash from previousHash, timestamp, and transactions", () => {
  const transactions = [{ id: "tx-1", type: "SELL", price: 50 }];
  const previousHash = "prev-hash-001";
  const block = new Block(transactions, previousHash);

  const expectedHash = createHash("sha256")
    .update(previousHash + block.timestamp + JSON.stringify(transactions))
    .digest("hex");

  assert.equal(block.hash, expectedHash);
  assert.equal(block.previousHash, previousHash);
  assert.deepEqual(block.transactions, transactions);
  assert.equal(block.nextHash, null);
});
