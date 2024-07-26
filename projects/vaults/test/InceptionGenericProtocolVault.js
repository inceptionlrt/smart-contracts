const { ethers, network, upgrades } = require("hardhat");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const IERC20 = require("@openzeppelin/contracts/build/contracts/IERC20.json");

describe("Deposit and Withdrawal Flow", function () {
  let stETHAddress = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84";
  let signerAddress = "0xF4477E81F2De150D48c4941c93E54D36aB82Ad3F";

  const impersonateWithEth = async (address, amount) => {
    await helpers.impersonateAccount(address);
    const account = await ethers.getSigner(address);

    // Deposit some Eth to account
    if (amount > 0n) {
      const [treasury] = await ethers.getSigners();
      await treasury.sendTransaction({ to: address, value: amount });
    }

    console.log(`Account impersonated at address: ${account.address}`);
    return account;
  };

  const initVault = async () => {
    const a = {
      assetName: "stETH",
      assetAddress: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
      assetPoolName: "LidoMockPool",
      assetPool: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
      vaultName: "InstEthVault",
      vaultFactory: "InVault_E2",
      strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
      assetStrategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
      iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
      delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
      withdrawalDelayBlocks: 20,
      ratioErr: 3n,
      transactErr: 5n,
      mellowDepositWrapper: "0x41A1FBEa7Ace3C3a6B66a73e96E5ED07CDB2A34d",
      mellowVault: "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
      impersonateStaker: async (staker, iVault, asset, assetPool) => {
        const donor = await impersonateWithEth("0x66b25CFe6B9F0e61Bd80c4847225Baf4EE6Ba0A2", ethers.utils.parseEther("1"));
        await asset.connect(donor).transfer(staker.address, ethers.utils.parseEther("1000"));
        const balanceAfter = await asset.balanceOf(staker.address);
        await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
        return staker;
      },
    };

    const block = await ethers.provider.getBlock("latest");
    console.log(`Starting at block number: ${block.number}`);
    console.log("... Initialization of Inception ....");

    console.log("- Asset");
    const asset = await ethers.getContractAt(a.assetName, a.assetAddress);
    console.log("- Asset pool");
    const assetPool = await ethers.getContractAt(a.assetPoolName, a.assetPool);
    console.log("- Strategy");
    const strategy = await ethers.getContractAt("IStrategy", a.assetStrategy);

    // 1. Inception token
    console.log("- iToken");
    const iTokenFactory = await ethers.getContractFactory("InceptionToken");
    const iToken = await upgrades.deployProxy(iTokenFactory, [
      "TEST InceptionLRT Token",
      "tINt",
    ]);
    // 2. Impersonate operator
    const iVaultOperator = await impersonateWithEth(a.iVaultOperator, ethers.utils.parseEther("1"));
    // 3. Staker implementation
    console.log("- Restaker implementation");
    const restakerImp = await ethers.getContractFactory("InceptionRestaker");
    const restaker = await restakerImp.deploy();
    await restaker.deployed();
    // 4. Delegation manager
    console.log("- Delegation manager");
    const delegationManager = await ethers.getContractAt(
      "IDelegationManager",
      a.delegationManager,
    );
    delegationManager.on(
      "WithdrawalQueued",
      (newRoot, migratedWithdrawal) => {
        console.log(`===Withdrawal queued: ${migratedWithdrawal.shares[0]}`);
      },
    );
    // 5. Ratio feed
    console.log("- Ratio feed");
    const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
    const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
    await ratioFeed.updateRatioBatch([await iToken.getAddress()], [ethers.utils.parseEther("1")]);
    // 6. Inception library
    console.log("- InceptionLibrary");
    const iLibrary = await ethers.getContractFactory("InceptionLibrary");
    const inceptionLibrary = await iLibrary.deploy();
    await inceptionLibrary.deployed();

    // 7. Inception vault
    console.log("- iVault");
    const iVaultFactory = await ethers.getContractFactory(a.vaultFactory, {
      libraries: { InceptionLibrary: inceptionLibrary.address },
    });
    const iVault = await upgrades.deployProxy(
      iVaultFactory,
      [
        a.vaultName,
        a.iVaultOperator,
        a.strategyManager,
        await iToken.getAddress(),
        a.assetStrategy,
        a.mellowDepositWrapper,
        a.mellowVault,
      ],
      { unsafeAllowLinkedLibraries: true },
    );
    iVault.on("DelegatedTo", (restaker, elOperator) => {
      console.log(`===Restaker to operator ${elOperator}, ${restaker}`);
    });
    await iVault.setDelegationManager(a.delegationManager);
    await iVault.upgradeTo(restaker.address);
    await iVault.setRatioFeed(ratioFeed.address);
    await iVault.addELOperator("0x0000000000000000000000000000000000000000"); // Add a valid node operator
    await iToken.setVault(iVault.address);

    return [
      iToken,
      iVault,
      ratioFeed,
      asset,
      assetPool,
      strategy,
      iVaultOperator,
      restaker,
      delegationManager,
      inceptionLibrary,
    ];
  };

  before(async function () {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [signerAddress],
    });

    this.signer = await ethers.getSigner(signerAddress);
    this.token = await ethers.getContractAt(IERC20.abi, stETHAddress);
    const [iToken, iVault, ratioFeed, asset, assetPool, strategy, iVaultOperator, restaker, delegationManager, inceptionLibrary] = await initVault();
    this.vault = iVault;
  });

  it("should deposit tokens to mellow", async function () {
    const amount = ethers.utils.parseEther("2");
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const depositTx = await this.vault.connect(this.signer).deposit(amount, this.signer.address);
    await depositTx.wait();
    console.log("Deposit transaction hash:", depositTx.hash);

    const depositMellowTx = await this.vault.connect(this.signer).depositMellow(amount, 0, deadline);
    await depositMellowTx.wait();
    console.log("Deposit to mellow transaction hash:", depositMellowTx.hash);
  });

  it("should register a withdrawal", async function () {
    const amount = ethers.utils.parseEther("2");
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const depositTx = await this.vault.connect(this.signer).deposit(amount, this.signer.address);
    await depositTx.wait();
    console.log("Deposit transaction hash:", depositTx.hash);

    const depositMellowTx = await this.vault.connect(this.signer).depositMellow(amount, 0, deadline);
    await depositMellowTx.wait();
    console.log("Deposit to mellow transaction hash:", depositMellowTx.hash);

    const lpAmount = ethers.utils.parseUnits("1", 18);
    const minAmount = ethers.utils.parseUnits("0.05", 18);
    const withdrawDeadline = Math.floor(Date.now() / 1000) + 3600;
    const requestDeadline = Math.floor(Date.now() / 1000) + 3600;
    const closePrevious = false;

    const withdrawTx = await this.vault.connect(this.signer).withdrawMellow(lpAmount, minAmount, withdrawDeadline, requestDeadline, closePrevious);
    await withdrawTx.wait();
    console.log("Register withdraw transaction hash:", withdrawTx.hash);
  });
});
