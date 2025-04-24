// Tests for InceptionVault_S contract;
// The S in name does not mean only Symbiotic; this file contains tests for Symbiotic and Mellow adapters

import { expect } from "chai";
import hardhat from "hardhat";
import { emptyBytes, adapters } from "../../../constants";
import { stETH } from "../../data/assets/inception-vault-s";
import { vaults } from "../../data/vaults";
import { initVault } from "../../src/init-vault";
const { ethers, network } = hardhat;

const symbioticVaults = vaults.symbiotic;
const mellowVaults = vaults.mellow;
const assetData = stETH;
describe(`Inception Symbiotic Vault ${assetData.assetName}`, function () {
  let iToken, iVault, mellowAdapter, symbioticAdapter;
  let iVaultOperator, staker, staker2, staker3;

  before(async function () {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.assetName.toLowerCase())) {
        console.log(`${assetData.assetName} is not in the list, going to skip`);
        this.skip();
      }
    }

    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, iVaultOperator, mellowAdapter, symbioticAdapter }
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    [, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);
  });

  after(async function () {
    await iVault?.removeAllListeners();
  });

  describe("AdapterHandler negative cases", function () {
    it("null adapter delegation", async function () {
      await expect(
        iVault
          .connect(iVaultOperator)
          .delegate("0x0000000000000000000000000000000000000000", symbioticVaults[0].vaultAddress, 0, emptyBytes),
      ).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("adapter not exists", async function () {
      await expect(
        iVault.connect(iVaultOperator).delegate(staker.address, symbioticVaults[0].vaultAddress, 0, emptyBytes),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");
    });

    it("undelegate input args", async function () {
      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate([await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");

      await expect(
        iVault.connect(iVaultOperator).undelegate([], [mellowVaults[0].vaultAddress], [1n], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");

      await expect(
        iVault.connect(iVaultOperator).undelegate([await mellowAdapter.getAddress()], [], [1n], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");

      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate([await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [1n], []),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");

      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate(
            ["0x0000000000000000000000000000000000000000"],
            [mellowVaults[0].vaultAddress],
            [1n],
            [emptyBytes],
          ),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate([await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [0n], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");
    });

    it("undelegateVault input args", async function () {
      await expect(
        iVault
          .connect(iVaultOperator)
          .emergencyUndelegate([staker.address], [mellowVaults[0].vaultAddress], [1n], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(
        iVault
          .connect(iVaultOperator)
          .emergencyUndelegate(
            [mellowAdapter.address],
            ["0x0000000000000000000000000000000000000000"],
            [1n],
            [emptyBytes],
          ),
      ).to.be.revertedWithCustomError(iVault, "InvalidAddress");

      await expect(
        iVault
          .connect(iVaultOperator)
          .emergencyUndelegate([mellowAdapter.address], [mellowVaults[0].vaultAddress], [0n], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");

      await expect(
        iVault
          .connect(staker)
          .emergencyUndelegate([mellowAdapter.address], [mellowVaults[0].vaultAddress], [0n], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");
    });

    it("claim input args", async function () {
      await expect(
        iVault.connect(staker).claim(0, [mellowAdapter.address], [mellowVaults[0].vaultAddress], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");

      await expect(
        iVault.connect(iVaultOperator).claim(0, [staker.address], [mellowVaults[0].vaultAddress], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");
    });

    it("addAdapter input args", async function () {
      await expect(iVault.addAdapter(staker.address)).to.be.revertedWithCustomError(iVault, "NotContract");

      await expect(iVault.addAdapter(mellowAdapter.address)).to.be.revertedWithCustomError(
        iVault,
        "AdapterAlreadyAdded",
      );

      await expect(iVault.connect(iVaultOperator).addAdapter(mellowAdapter.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("removeAdapter input args", async function () {
      await expect(iVault.removeAdapter(staker.address)).to.be.revertedWithCustomError(iVault, "NotContract");

      await expect(iVault.removeAdapter(iToken.address)).to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(iVault.connect(staker).removeAdapter(mellowAdapter.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );

      await iVault.removeAdapter(mellowAdapter.address);
    });
  });

  describe("SymbioticAdapter input args", function () {
    it("withdraw input args", async function () {
      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate([await symbioticAdapter.getAddress()], [staker.address], [1n], [emptyBytes]),
      ).to.be.revertedWithCustomError(symbioticAdapter, "InvalidVault");
    });

    it("add & remove vaults input args", async function () {
      await expect(symbioticAdapter.connect(iVaultOperator).addVault(staker.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );

      await expect(
        symbioticAdapter.connect(iVaultOperator).removeVault(symbioticVaults[0].vaultAddress),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("MellowAdapter input args", function () {
    it("setEthWrapper input args", async function () {
      await expect(mellowAdapter.connect(iVaultOperator).setEthWrapper(staker.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );

      await expect(mellowAdapter.setEthWrapper(staker.address)).to.be.revertedWithCustomError(
        mellowAdapter,
        "NotContract",
      );
    });
  });
});
