import axios from "axios";
import Transaction from "./transaction.js";

class MarketplaceNode {
  constructor(url, peers = [], blockchain) {
    this.url = url;
    this.peers = peers;
    this.blockchain = blockchain;
    this.balance = 50000;
    this.songs = {};
    this.#broadcastSelf();
  }

  async #broadcast(path, data) {
    await Promise.all(
      this.peers.map(async (peer) => this.#broadcastToPeer(peer, path, data))
    );
  }

  async #broadcastSelf() {
    this.#broadcast("register-node", { url: this.url });
  }

  async #broadcastBlockchain() {
    this.#broadcast("sync-blockchain", { chain: this.blockchain.chain });
  }

  async registerNode(newNodeUrl) {
    this.peers.push(newNodeUrl);
    await this.#broadcast("sync-peers", { peers: this.peers });
  }

  async processTransaction(transactionHash) {
    const transaction = new Transaction(transactionHash);
    const id = transactionHash.id || transaction.id;
    if (this.#isBuyTransaction(transaction)) {
      if (this.balance < transaction.price) return "Insufficient balance";
      this.balance -= transaction.price;
      await this.#sendPayment(transaction);
    }
    this.songs[id] = transaction;
    this.blockchain.pendingTransactions.push(transaction);
    if (this.#shouldMine()) {
      await this.#mine();
    }
    await this.#broadcastBlockchain();
    return "Processed transaction";
  }

  async #mine() {
    const price = this.blockchain.miningReward;
    const reward = this.#createRewardTransaction(price);
    this.blockchain.pendingTransactions.push(reward);
    await this.blockchain.mineBlock();
    this.balance += price;
    return "Mining complete";
  }

  availableSongs() {
    return Object.values(this.songs)
      .filter((transaction) => transaction.type === "SELL")
      .map(({ id, songTitle, price }) => [id, songTitle, price]);
  }

  async #broadcastToPeer(peer, path, data) {
    if (peer === this.url) return;
    try {
      await axios.post(`${peer}/${path}`, data);
    } catch (error) {
      console.error(error.message);
    }
  }

  #isBuyTransaction(transaction) {
    return transaction.type === "BUY";
  }

  async #sendPayment(transaction) {
    const payoutTarget = transaction.recipient || transaction.sender;
    try {
      await axios.post(`${payoutTarget}/payment`, {
        price: transaction.price,
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  #shouldMine() {
    return this.blockchain.pendingTransactions.length > 4;
  }

  #createRewardTransaction(price) {
    return new Transaction({
      sender: this.peers[0],
      recipient: this.url,
      price,
      type: "MINE",
    });
  }
}
export default MarketplaceNode;
