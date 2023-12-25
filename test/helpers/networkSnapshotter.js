const { network } = require('hardhat');

class NetworkSnapshotter {
  snapshotId;

  constructor() {
    this.snapshotId = 0;
  }

  async snapshot() {
    this.snapshotId = await network.provider.send("evm_snapshot", []);
    console.log(`... Hardhat snapshot #${this.snapshotId} was captured ...`);
  }

  async revert() {
    await network.provider.send("evm_revert", [this.snapshotId]);
    console.log(`... Hardhat snapshot #${this.snapshotId} was reverted ...`);
    this.snapshotId = await network.provider.send("evm_snapshot", []);
  }

}

module.exports = NetworkSnapshotter;