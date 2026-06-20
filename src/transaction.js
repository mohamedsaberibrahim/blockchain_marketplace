import { createHash, randomUUID } from "crypto";

class Transaction {
  constructor(data = {}) {
    this.id = data.id || randomUUID();
    this.timestamp = data.timestamp || Date.now();
    this.type = (data.type || "BUY").toUpperCase();
    this.sender = data.sender || null;
    this.recipient = data.recipient || data.receiver || null;
    this.receiver = this.recipient;
    this.songTitle = data.songTitle || null;
    this.artist = data.artist || null;
    this.price = Number(data.price) || 0;
    this.hash = data.hash || this.calculateHash();
  }

  calculateHash() {
    return createHash("sha256")
      .update(
        this.id +
          this.timestamp +
          this.type +
          this.sender +
          this.recipient +
          this.songTitle +
          this.artist +
          this.price
      )
      .digest("hex");
  }
}

export default Transaction;
