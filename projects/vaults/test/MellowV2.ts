import hardhat from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

const { ethers, network, upgrades } = hardhat;

describe("Mellow v2", function () {
  let deployer, owner, operator;

  beforeEach(async function () {
    // IMPERSONATION
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x650bD9Dee50E3eE15cbb49749ff6ABcf55A8FB1e"],
    });
    await network.provider.send("hardhat_setBalance", [
      "0x650bD9Dee50E3eE15cbb49749ff6ABcf55A8FB1e",
      "0x10000000000000000000",
    ]);
    deployer = await ethers.getSigner("0x650bD9Dee50E3eE15cbb49749ff6ABcf55A8FB1e");

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8e6C8799B542E507bfDDCA1a424867e885D96e79"],
    });
    await network.provider.send("hardhat_setBalance", [
      "0x8e6C8799B542E507bfDDCA1a424867e885D96e79",
      "0x10000000000000000000",
    ]);
    owner = await ethers.getSigner("0x8e6C8799B542E507bfDDCA1a424867e885D96e79");

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xd87D15b80445EC4251e33dBe0668C335624e54b7"],
    });
    await network.provider.send("hardhat_setBalance", [
      "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
      "0x10000000000000000000",
    ]);
    operator = await ethers.getSigner("0xd87D15b80445EC4251e33dBe0668C335624e54b7");
  });

  describe("test #1", function () {
    before(async function () {
      // FORKING
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: "https://eth.drpc.org",
              blockNumber: 21717995,
            },
          },
        ],
      });
    });

    it("", async function () {
      await ethers.getContractAt("InceptionToken", "0x8E0789d39db454DBE9f4a77aCEF6dc7c69f6D552");
      let oldAbi = [
        "function totalAmountToWithdraw() external view returns(uint256)",
        "function getTotalDeposited() external view returns(uint256)",
        "function getTotalDelegated() external view returns(uint256)",
        "function getDelegatedTo(address) external view returns(uint256)",
        "function getFreeBalance() external view returns(uint256)",
        "function getFlashCapacity() external view returns(uint256)",
        "function getPendingWithdrawalAmountFromMellow() external view returns(uint256)",
      ];
      let vault = await ethers.getContractAt(oldAbi, "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97");

      console.log("1==== 21717995 - Final block where all integrated vaults are mellowv1");
      console.log("Our contracts are not upgraded");
      // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log("Delegated (MEV): " + (await vault.getDelegatedTo("0x5fD13359Ba15A84B76f7F87568309040176167cd")));
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log("PendingWithdraw: " + (await vault.getPendingWithdrawalAmountFromMellow()));

      let adapter = await ethers.getContractAt(
        "InceptionWstETHMellowAdapter",
        "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
      );
      console.log("CONVERSIONS");
      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );

      console.log("Depositing 20 wstETH to all vaults");
      let oldVault = await ethers.getContractAt(
        [
          "function delegateToMellowVault(address,uint256) external",
          "function undelegateFrom(address,uint256) external",
        ],
        await vault.getAddress(),
      );

      await oldVault
        .connect(operator)
        .delegateToMellowVault("0x5fD13359Ba15A84B76f7F87568309040176167cd", "20000000000000000000");
      await oldVault
        .connect(operator)
        .delegateToMellowVault("0x7a4EffD87C2f3C55CA251080b1343b605f327E3a", "20000000000000000000");
      await oldVault
        .connect(operator)
        .delegateToMellowVault("0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a", "20000000000000000000");
      await oldVault
        .connect(operator)
        .delegateToMellowVault("0x49cd586dd9BA227Be9654C735A659a1dB08232a9", "20000000000000000000");
      await oldVault
        .connect(operator)
        .delegateToMellowVault("0xd6E09a5e6D719d1c881579C9C8670a210437931b", "20000000000000000000");
      await oldVault
        .connect(operator)
        .delegateToMellowVault("0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD", "20000000000000000000");

      console.log("AFTER DEPOSITS");
      // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log("Delegated (MEV): " + (await vault.getDelegatedTo("0x5fD13359Ba15A84B76f7F87568309040176167cd")));
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log("PendingWithdraw: " + (await vault.getPendingWithdrawalAmountFromMellow()));

      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );

      console.log("Withdrawing 20 wstETH from all vaults");
      await oldVault
        .connect(operator)
        .undelegateFrom("0x5fD13359Ba15A84B76f7F87568309040176167cd", "20000000000000000000");
      await oldVault
        .connect(operator)
        .undelegateFrom("0x7a4EffD87C2f3C55CA251080b1343b605f327E3a", "20000000000000000000");
      await oldVault
        .connect(operator)
        .undelegateFrom("0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a", "20000000000000000000");
      await oldVault
        .connect(operator)
        .undelegateFrom("0x49cd586dd9BA227Be9654C735A659a1dB08232a9", "20000000000000000000");
      await oldVault
        .connect(operator)
        .undelegateFrom("0xd6E09a5e6D719d1c881579C9C8670a210437931b", "20000000000000000000");
      await oldVault
        .connect(operator)
        .undelegateFrom("0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD", "20000000000000000000");

      console.log("AFTER WITHDRAWS");
      // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log("Delegated (MEV): " + (await vault.getDelegatedTo("0x5fD13359Ba15A84B76f7F87568309040176167cd")));
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log("PendingWithdraw: " + (await vault.getPendingWithdrawalAmountFromMellow()));

      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
    });
  });
  describe("test #2", function () {
    before(async function () {
      // FORKING
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: "https://eth.drpc.org",
              blockNumber: 21717996,
            },
          },
        ],
      });
    });

    it("", async function () {
      this.timeout(150000000);

      // Factory
      const VaultFactory = await hre.ethers.getContractFactory("InceptionVault_S", {
        libraries: {
          InceptionLibrary: "0xF6940A8e7334Ab2a7781AF6f9E5aeD8EFB55116A",
        },
      });
      const MellowRestakerFactory = await hre.ethers.getContractFactory("InceptionWstETHMellowAdapter");

      // Imps
      let vaultImp = await VaultFactory.deploy();
      await vaultImp.waitForDeployment();
      let restakerImp = await MellowRestakerFactory.deploy();
      await restakerImp.waitForDeployment();

      // Upgrades
      let proxyAdminVault = await ethers.getContractAt(
        ["function upgradeAndCall(address,address,bytes) external payable"],
        "0xC40F099e73aDB9b78a6c1AB22c520D635fFb4D53",
      );
      let proxyAdminRestaker = await ethers.getContractAt(
        ["function upgradeAndCall(address,address,bytes) external payable"],
        "0xAb31156bcDD9C280Bb7b0d8062EFeD26e5c725AF",
      );

      await proxyAdminVault
        .connect(deployer)
        .upgradeAndCall("0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97", await vaultImp.getAddress(), "0x");
      await proxyAdminRestaker
        .connect(deployer)
        .upgradeAndCall("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", await restakerImp.getAddress(), "0x");

      let inceptionToken = await ethers.getContractAt("InceptionToken", "0x8E0789d39db454DBE9f4a77aCEF6dc7c69f6D552");
      let vault = await ethers.getContractAt("InceptionVault_S", "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97");

      const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
      let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [await vault.getAddress(), [], [], 0]);
      await vault.connect(owner).setWithdrawalQueue(await withdrawalQueue.getAddress());

      console.log("2==== 21717996 - First block where MEV is now using mellowv2");
      console.log("Our contracts are upgraded");
      // // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      // console.log("Total Deposited: " + await vault.getTotalDeposited());
      // console.log("Total Delegated: " + await vault.getTotalDelegated());
      console.log(
        "Delegated (MEV): " +
          (await vault.getDelegatedTo(
            "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
            "0x5fD13359Ba15A84B76f7F87568309040176167cd",
          )),
      );
      // console.log("FreeBalance    : " + await vault.getFreeBalance());
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      // console.log("PendingWithdraw: " + await vault.getPendingWithdrawalAmountFromMellow());
    });
  });
  describe("test #3", function () {
    before(async function () {
      // FORKING
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: "https://eth.drpc.org",
              blockNumber: 21737235,
            },
          },
        ],
      });
    });

    it("", async function () {
      this.timeout(150000000);

      // Factory
      const VaultFactory = await hre.ethers.getContractFactory("InceptionVault_S", {
        libraries: {
          InceptionLibrary: "0xF6940A8e7334Ab2a7781AF6f9E5aeD8EFB55116A",
        },
      });
      const MellowRestakerFactory = await hre.ethers.getContractFactory("InceptionWstETHMellowAdapter");

      // Imps
      let vaultImp = await VaultFactory.deploy();
      await vaultImp.waitForDeployment();
      let restakerImp = await MellowRestakerFactory.deploy();
      await restakerImp.waitForDeployment();

      // Upgrades
      let proxyAdminVault = await ethers.getContractAt(
        ["function upgradeAndCall(address,address,bytes) external payable"],
        "0xC40F099e73aDB9b78a6c1AB22c520D635fFb4D53",
      );
      let proxyAdminRestaker = await ethers.getContractAt(
        ["function upgradeAndCall(address,address,bytes) external payable"],
        "0xAb31156bcDD9C280Bb7b0d8062EFeD26e5c725AF",
      );

      await proxyAdminVault
        .connect(deployer)
        .upgradeAndCall("0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97", await vaultImp.getAddress(), "0x");
      await proxyAdminRestaker
        .connect(deployer)
        .upgradeAndCall("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", await restakerImp.getAddress(), "0x");

      let inceptionToken = await ethers.getContractAt("InceptionToken", "0x8E0789d39db454DBE9f4a77aCEF6dc7c69f6D552");
      let vault = await ethers.getContractAt("InceptionVault_S", "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97");

      console.log("3==== All mellowvaults are using mellowv2");
      console.log("Setting ethWrapper");
      let adapter = await ethers.getContractAt(
        "InceptionWstETHMellowAdapter",
        "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
      );
      await adapter.connect(owner).setEthWrapper("0x7A69820e9e7410098f766262C326E211BFa5d1B1");

      const MellowAdapterClaimerFactory = await hre.ethers.getContractFactory("MellowAdapterClaimer");
      const claimerImplementation = await MellowAdapterClaimerFactory.deploy();
      await claimerImplementation.waitForDeployment();

      await adapter.connect(owner).setClaimerImplementation(await claimerImplementation.getAddress());

      const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
      let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [await vault.getAddress(), [], [], 0]);
      await vault.connect(owner).setWithdrawalQueue(await withdrawalQueue.getAddress());

      console.log("Our contracts are upgraded");
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log(
        "Delegated (MEV): " +
          (await vault.getDelegatedTo(
            "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
            "0x5fD13359Ba15A84B76f7F87568309040176167cd",
          )),
      );
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log(
        "PendingWithdraw: " + (await vault.getPendingWithdrawals("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378")),
      );

      console.log("CONVERSIONS");
      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );

      console.log("Depositing 20 wstETH to all vaults");

      console.log("operator addr", await operator.getAddress());
      await vault.connect(owner).addAdapter("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378");
      await vault
        .connect(operator)
        .delegate(
          "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
          "0x5fD13359Ba15A84B76f7F87568309040176167cd",
          "20000000000000000000",
          [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          ],
        );
      await vault
        .connect(operator)
        .delegate(
          "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
          "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
          "20000000000000000000",
          [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          ],
        );
      await vault
        .connect(operator)
        .delegate(
          "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
          "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a",
          "20000000000000000000",
          [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          ],
        );
      await vault
        .connect(operator)
        .delegate(
          "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
          "0x49cd586dd9BA227Be9654C735A659a1dB08232a9",
          "20000000000000000000",
          [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          ],
        );
      await vault
        .connect(operator)
        .delegate(
          "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
          "0xd6E09a5e6D719d1c881579C9C8670a210437931b",
          "20000000000000000000",
          [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          ],
        );
      await vault
        .connect(operator)
        .delegate(
          "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
          "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD",
          "20000000000000000000",
          [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          ],
        );

      console.log("AFTER DEPOSITS");
      // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log(
        "Delegated (MEV): " +
          (await vault.getDelegatedTo(
            "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
            "0x5fD13359Ba15A84B76f7F87568309040176167cd",
          )),
      );
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log(
        "PendingWithdraw: " + (await vault.getPendingWithdrawals("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378")),
      );

      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );

      console.log("Withdrawing 20 wstETH from all vaults");
      console.log(
        "MellowV2 gives portion on withdrawal, portion is in pending state which will become in claimable state after some epoch",
      );

      let tx = await vault
        .connect(operator)
        .emergencyUndelegate([
          ["0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x5fD13359Ba15A84B76f7F87568309040176167cd", "10000000000000000000", ["0x"]],
        ]);
      let receipt = await tx.wait();
      let events1 = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let tx2 = await vault
        .connect(operator)
        .emergencyUndelegate([
          ["0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a", "15000000000000000000", ["0x"]],
        ]);
      let receipt2 = await tx2.wait();
      let events2 = receipt2.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let tx3 = await vault
        .connect(operator)
        .emergencyUndelegate([
          ["0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a", "10000000000000000000", ["0x"]],
        ]);
      let receipt3 = await tx3.wait();
      let events3 = receipt3.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let tx4 = await vault
        .connect(operator)
        .emergencyUndelegate([
          ["0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x49cd586dd9BA227Be9654C735A659a1dB08232a9", "15000000000000000000", ["0x"]],
        ]);
      let receipt4 = await tx4.wait();
      let events4 = receipt4.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let tx5 = await vault
        .connect(operator)
        .emergencyUndelegate([
          ["0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0xd6E09a5e6D719d1c881579C9C8670a210437931b", "10000000000000000000", ["0x"]],
        ]);
      let receipt5 = await tx5.wait();
      let events5 = receipt5.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let tx6 = await vault
        .connect(operator)
        .emergencyUndelegate([
          ["0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD", "15000000000000000000", ["0x"]]
        ]);
      let receipt6 = await tx6.wait();
      let events6 = receipt6.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let adapterAddress = await adapter.getAddress();
      const adapterEvents = receipt6.logs
        ?.filter(log => log.address === adapterAddress)
        .map(log => adapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      console.log("AFTER WITHDRAWS");
      // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log(
        "Delegated (MEV): " +
          (await vault.getDelegatedTo(
            "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
            "0x5fD13359Ba15A84B76f7F87568309040176167cd",
          )),
      );
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log(
        "PendingWithdraw: " + (await vault.getPendingWithdrawals("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378")),
      );

      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );

      console.log("PendingWithdrawalAmountInMellow  : " + (await adapter.pendingWithdrawalAmount()));
      console.log("ClaimableWithdrawalAmountInMellow: " + (await adapter.claimableWithdrawalAmount()));
      console.log("PortionsGivenBackOnWithdrawTX    : " + (await adapter.claimableAmount()));

      console.log("Increasing epoch");
      await helpers.time.increase(1209900);

      console.log("ClaimMellowWithdrawCallback");
      const abi = ethers.AbiCoder.defaultAbiCoder();

      if (events1[0].args["actualAmounts"] > 0) {
        await vault
          .connect(operator)
          .claim(
            0,
            [
              "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
              "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
              "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
              "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
              "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
              "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
            ],
            [
              "0x5fD13359Ba15A84B76f7F87568309040176167cd",
              "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
              "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a",
              "0x49cd586dd9BA227Be9654C735A659a1dB08232a9",
              "0xd6E09a5e6D719d1c881579C9C8670a210437931b",
              "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD",
            ],
            [
              [abi.encode(["address", "address"], ["0x5fD13359Ba15A84B76f7F87568309040176167cd", claimer])],
              [abi.encode(["address", "address"], ["0x7a4EffD87C2f3C55CA251080b1343b605f327E3a", claimer])],
              [abi.encode(["address", "address"], ["0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a", claimer])],
              [abi.encode(["address", "address"], ["0x49cd586dd9BA227Be9654C735A659a1dB08232a9", claimer])],
              [abi.encode(["address", "address"], ["0xd6E09a5e6D719d1c881579C9C8670a210437931b", claimer])],
              [abi.encode(["address", "address"], ["0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD", claimer])],
            ],
          );
      }

      // if (events2[0].args["actualAmounts"] > 0) {
      //     await vault.connect(operator).claim(0, "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a", [abi.encode(["address"], ["0x7a4EffD87C2f3C55CA251080b1343b605f327E3a"])]);
      // }
      //
      // if (events3[0].args["actualAmounts"] > 0) {
      //     await vault.connect(operator).claim(0, "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a", [abi.encode(["address"], ["0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a"])]);
      // }
      //
      // if (events4[0].args["actualAmounts"] > 0) {
      //     await vault.connect(operator).claim(0, "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0x49cd586dd9BA227Be9654C735A659a1dB08232a9", [abi.encode(["address"], ["0x49cd586dd9BA227Be9654C735A659a1dB08232a9"])]);
      // }
      //
      // if (events5[0].args["actualAmounts"] > 0) {
      //     await vault.connect(operator).claim(0, "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0xd6E09a5e6D719d1c881579C9C8670a210437931b", [abi.encode(["address"], ["0xd6E09a5e6D719d1c881579C9C8670a210437931b"])]);
      // }
      //
      // if (events6[0].args["actualAmounts"] > 0) {
      //     await vault.connect(operator).claim(0, "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378", "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD", [abi.encode(["address"], ["0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD"])]);
      // }

      console.log("AFTER ClaimMellowWithdrawCallback");
      // console.log("Ratio          : " + (await inceptionToken.totalSupply() * 1000000000000000000n) / (await vault.getTotalDeposited() - await vault.totalAmountToWithdraw()));
      console.log("Total Deposited: " + (await vault.getTotalDeposited()));
      console.log("Total Delegated: " + (await vault.getTotalDelegated()));
      console.log(
        "Delegated (MEV): " +
          (await vault.getDelegatedTo(
            "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378",
            "0x5fD13359Ba15A84B76f7F87568309040176167cd",
          )),
      );
      console.log("FreeBalance    : " + (await vault.getFreeBalance()));
      console.log("FlashCapacity  : " + (await vault.getFlashCapacity()));
      console.log(
        "PendingWithdraw: " + (await vault.getPendingWithdrawals("0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378")),
      );

      console.log(
        "Vault 1: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );
      console.log(
        "Vault 1: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x5fD13359Ba15A84B76f7F87568309040176167cd")),
      );

      console.log(
        "Vault 2: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );
      console.log(
        "Vault 2: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a")),
      );

      console.log(
        "Vault 3: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );
      console.log(
        "Vault 3: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a")),
      );

      console.log(
        "Vault 4: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );
      console.log(
        "Vault 4: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0x49cd586dd9BA227Be9654C735A659a1dB08232a9")),
      );

      console.log(
        "Vault 5: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );
      console.log(
        "Vault 5: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xd6E09a5e6D719d1c881579C9C8670a210437931b")),
      );

      console.log(
        "Vault 6: " +
          (await adapter.amountToLpAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );
      console.log(
        "Vault 6: " +
          (await adapter.lpAmountToAmount(1000000000000000000n, "0xcC36e5272c422BEE9A8144cD2493Ac472082eBaD")),
      );

      console.log("PendingWithdrawalAmountInMellow  : " + (await adapter.pendingWithdrawalAmount()));
      console.log("ClaimableWithdrawalAmountInMellow: " + (await adapter.claimableWithdrawalAmount()));
      console.log("PortionsGivenBackOnWithdrawTX    : " + (await adapter.claimableAmount()));
    });
  });
});

