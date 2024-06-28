const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const minDelay = 10n;

describe("InceptionTimeLock", function () {
  this.timeout(150000);

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, proposer, executor, admin, account1] = await ethers.getSigners();

    const TimeLock = await ethers.getContractFactory("InceptionTimeLock");
    const timelock = await TimeLock.deploy(minDelay, [proposer.address], [executor.address]);
    const timelockAddress = await timelock.getAddress();

    return { timelock, timelockAddress, owner, proposer, executor, admin, account1 };
  }

  describe("add tx to queue and execute", function () {
    let timelock, timelockAddress, owner, proposer, executor, admin, tx, account1, txArgs, id, creationTime;

    before(async function () {
      const fixtures = await loadFixture(deploy);
      timelock = fixtures.timelock;
      timelockAddress = fixtures.timelockAddress;
      owner = fixtures.owner;
      proposer = fixtures.proposer;
      admin = fixtures.admin;
      account1 = fixtures.account1;
      executor = fixtures.executor;
    });

    it("Deploy", async function () {
      expect(await timelock.hasRole(await timelock.PROPOSER_ROLE(), proposer.address)).to.be.true;
      expect(await timelock.hasRole(await timelock.EXECUTOR_ROLE(), executor.address)).to.be.true;
      expect((await timelock.getMinDelay()).toString()).to.be.equal(minDelay);
    });

    it("add tx to queue by not a proposer :: reverted", async () => {
      txArgs = [account1.address, "1000", "0x", ethers.encodeBytes32String(""), ethers.encodeBytes32String(""), minDelay];
      await expect(timelock.connect(account1).schedule(...txArgs)).to.be.revertedWith(
        /AccessControl: account 0x.{40} is missing role 0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1/
      );
    });

    it("add tx with less than min offset", async () => {
      txArgs = [account1.address, "1000", "0x", ethers.encodeBytes32String(""), ethers.encodeBytes32String(""), minDelay - 1n];
      await expect(timelock.connect(proposer).schedule(...txArgs)).to.be.revertedWith("TimelockController: insufficient delay");
    });

    it("add tx to queue with min offset", async () => {
      txArgs = {
        target: account1.address,
        value: "1000",
        data: "0x",
        predecessor: ethers.encodeBytes32String(""),
        salt: ethers.encodeBytes32String(""),
        delay: minDelay
      };

      id = await timelock.hashOperation(...Object.values(txArgs).slice(0, 5));
      tx = await timelock.connect(proposer).schedule(...Object.values(txArgs));
      expect(tx)
        .to.emit(timelock, "CallScheduled")
        .withArgs(id, 0n, txArgs.target, txArgs.value, txArgs.data, txArgs.predecessor, txArgs.delay);
      creationTime = BigInt(await time.latest());
    });

    it("get status after creation", async () => {
      expect(await timelock.isOperationPending(id)).to.be.true;
      expect(await timelock.isOperationReady(id)).to.be.false;
      expect(await timelock.isOperationDone(id)).to.be.false;
    });

    it("execute instantly :: period not passed", async () => {
      await expect(timelock.connect(executor).execute(...Object.values(txArgs).slice(0, 5)))
        .to.be.revertedWith("TimelockController: operation is not ready");
    });

    it("execute by not an owner instantly :: not owner", async () => {
      await expect(timelock.connect(account1).execute(...Object.values(txArgs).slice(0, 5)))
        .to.be.revertedWith(/AccessControl: account 0x.{40} is missing role 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63/);
    });

    it("get timestamp by args", async () => {
      expect(await timelock.getTimestamp(id)).to.be.eq(creationTime + minDelay);
    });

    it("isReady when execution time is come", async () => {
      await time.increaseTo(await timelock.getTimestamp(id));
      expect(await timelock.isOperationReady(id)).to.be.true;
    });

    it("execute before timelock is funded :: underlying transaction reverted", async () => {
      // fund the contract to execute tx
      await expect(timelock.connect(executor).execute(...Object.values(txArgs).slice(0, 5)))
        .to.be.revertedWith("TimelockController: underlying transaction reverted");
    });

    it("execute by not an owner when ready:: not owner", async () => {
      await owner.sendTransaction({ from: owner.address, to: timelockAddress, value: txArgs.value });
      await expect(timelock.connect(account1).execute(...Object.values(txArgs).slice(0, 5))).to.be.revertedWith(
        /AccessControl: account 0x.{40} is missing role 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63/
      );
    });

    it("execute when delay passed :: success", async () => {
      const balanceBefore = await ethers.provider.getBalance(account1.address);
      console.log(`Balance before: ${balanceBefore}`);
      expect(await timelock.connect(executor).execute(...Object.values(txArgs).slice(0, 5)))
        .to.emit(timelock, "CallExecuted")
        .withArgs(anyValue, 0n, txArgs.target, txArgs.value, txArgs.data);
      expect(await timelock.isOperationDone(id)).to.be.true;
      const balanceAfter = await ethers.provider.getBalance(account1.address);
      console.log(`Balance after: ${balanceAfter}`);
      expect(balanceAfter - balanceBefore).to.be.eq(txArgs.value);
      expect(await ethers.provider.getBalance(timelockAddress)).to.be.eq(0);
    });

    it("repeat execution :: not ready", async () => {
      await owner.sendTransaction({ from: owner.address, to: timelockAddress, value: txArgs.value });
      await expect(timelock.connect(executor).execute(...Object.values(txArgs).slice(0, 5)))
        .to.be.revertedWith("TimelockController: operation is not ready");
    });
  });
});
