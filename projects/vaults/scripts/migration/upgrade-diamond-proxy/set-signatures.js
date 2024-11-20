const fs = require("fs").promises;
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");
const { ethers } = require("hardhat");

const { addresses } = require("../config-addresses");

async function setSignatureBatch(IVaultAddress, InceptionLibraryAddress) {
  const [deployer] = await ethers.getSigners();

  console.log("Setting signatures with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const iVault = await ethers.getContractAt("InceptionVault_EL", IVaultAddress);
  const [eigenSetterFacetAddress, erc4626FacetAddress, eigenFacetAddress] = await getFacetAddresses();

  let tx = await iVault.setSetterFacet(eigenSetterFacetAddress);
  await tx.wait();

  tx = await iVault.setEigenLayerFacet(eigenFacetAddress);
  await tx.wait();

  tx = await iVault.setERC4626Facet(erc4626FacetAddress);
  await tx.wait();

  const [sigs, accesses, targets] = await generateTransactionData();

  if (network.name === "mainnet") {
    await gnosisSafe([sigs, accesses, targets]);
  } else {
    tx = await iVault.setSignaturesBatch(sigs, targets, accesses);
    await tx.wait();
  }

  const setterFacetFactory = await ethers.getContractFactory("EigenSetterFacet", {
    libraries: { InceptionLibrary: InceptionLibraryAddress },
  });
  const setterFacet = setterFacetFactory.attach(IVaultAddress);

  tx = await setterFacet.setRewardsCoordinator(addresses.RewardsCoordinator);
  await tx.wait();

  console.log("The signatures have been set");
  console.log(`spent: ${(initBalance - (await deployer.provider.getBalance(deployer.address))).toString()}`);
}

async function generateTransactionData(InceptionLibraryAddress) {
  /**
   * Prepare a batch of set transactions
   */

  let sigs = [];
  let accesses = [];
  let facetIds = [];

  /// =============================== ################## ===============================
  /// ================================= Setter Handler =================================
  /// =============================== ################## ===============================

  const setterFacetFactory = await ethers.getContractFactory("EigenSetterFacet", {
    libraries: { InceptionLibrary: InceptionLibraryAddress },
  });

  let facetId = "0";
  let accessId = "2";

  let funcSig = setterFacetFactory.interface.getFunction("setDelegationManager").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setRewardsCoordinator").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("upgradeTo").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setRatioFeed").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("addELOperator").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setTreasuryAddress").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setOperator").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setMinAmount").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setName").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setTargetFlashCapacity").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setProtocolFee").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setDepositBonusParams").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setFlashWithdrawFeeParams").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getFunction("setRewardsTimeline").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  /// =============================== ################## ===============================
  /// =============================== EigenLayer Handler ===============================
  /// =============================== ################## ===============================

  const eigenLayerFacetFactory = await ethers.getContractFactory("EigenLayerFacet", {
    libraries: { InceptionLibrary: InceptionLibraryAddress },
  });

  facetId = "1";
  accessId = "1";

  funcSig = eigenLayerFacetFactory.interface.getFunction("delegateToOperator").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getFunction("undelegateFrom").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getFunction("undelegateVault").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getFunction("claimCompletedWithdrawals").selector;
  /// Everyone is able to claim
  // await iVault.setSignature(funcSig, facetId, "0");
  sigs.push(funcSig);
  facetIds.push(facetId);
  accesses.push("0");

  funcSig = eigenLayerFacetFactory.interface.getFunction("updateEpoch").selector;
  // await iVault.setSignature(funcSig, facetId, "0");
  sigs.push(funcSig);
  facetIds.push(facetId);
  accesses.push("0");

  funcSig = eigenLayerFacetFactory.interface.getFunction("addRewards").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getFunction("forceUndelegateRecovery").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  /// ================================= ####### =================================
  /// ================================= ERC4626 =================================
  /// ================================= ####### =================================

  const ERC4626FacetFactory = await ethers.getContractFactory("ERC4626Facet_EL_E2", {
    libraries: { InceptionLibrary: InceptionLibraryAddress },
  });

  facetId = "2";
  accessId = "0";

  funcSig = ERC4626FacetFactory.interface.getFunction("deposit").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("mint").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("depositWithReferral").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("withdraw(uint256,address)").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("flashWithdraw").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("isAbleToRedeem").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("redeem(address)").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getFunction("redeem(uint256,address,address)").selector;
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  return [sigs, accesses, facetIds];
}

async function gnosisSafe(signaturesData) {
  //   {
  //       to: existing.address,
  //       value: 0,
  //       method: "setPartnersContract",
  //       args: {
  //         newValue: partnersContract,
  //       },
  //     },

  new BatchBuilder("", `${upgradeName}_${address}`, "added pausable functions", provider)
    .add({
      to: existing.address,
      value: 0,
      method: "setSignaturesBatch",
      args: {
        newValue: signaturesData,
      },
    })
    .save();
}

async function getFacetAddresses() {
  const filePath = `./scripts/migration/facet_addresses/${network.name}.json`;
  const jsonString = await fs.readFile(filePath, "utf8");
  const jsonObject = JSON.parse(jsonString);
  const dataMap = new Map(Object.entries(jsonObject));

  return [dataMap.get("eigenSetterFacet"), dataMap.get("erc4626Facet"), dataMap.get("eigenFacet")];
}

module.exports = {
  setSignatureBatch,
};

