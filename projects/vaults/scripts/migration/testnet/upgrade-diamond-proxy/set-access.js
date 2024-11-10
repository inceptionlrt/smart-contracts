const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");
const { ethers, upgrades } = require("hardhat");

/// REPLACE IT
const IVAULT_ADDRESS = "0x4267Cf4df74C5cBDC2E97F0633f2caBFe9F999F2";

async function main() {
  /**
   * Prepare a batch of set transactions
   */

  /// =============================== ################## ===============================
  /// ================================= Setter Handler =================================
  /// =============================== ################## ===============================

  let facetId = "0";
  let accessId = "2";

  // Get the signature (first 4 bytes of the Keccak-256 hash) for the `transfer` function
  let funcSig = setterFacet.interface.getFunction("setDelegationManager").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("upgradeTo").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setRatioFeed").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("addELOperator").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setTreasuryAddress").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setOperator").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setMinAmount").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setName").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setTargetFlashCapacity").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setProtocolFee").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setDepositBonusParams").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setFlashWithdrawFeeParams").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = setterFacet.interface.getFunction("setRewardsTimeline").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  /// =============================== ################## ===============================
  /// =============================== EigenLayer Handler ===============================
  /// =============================== ################## ===============================

  facetId = "1";
  accessId = "1";

  funcSig = eigenLayerFacet.interface.getFunction("delegateToOperator").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = eigenLayerFacet.interface.getFunction("undelegateFrom").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = eigenLayerFacet.interface.getFunction("undelegateVault").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = eigenLayerFacet.interface.getFunction("claimCompletedWithdrawals").selector;
  /// Everyone is able to claim
  await iVault.setSignature(funcSig, facetId, "0");

  funcSig = eigenLayerFacet.interface.getFunction("updateEpoch").selector;
  await iVault.setSignature(funcSig, facetId, "0");

  funcSig = eigenLayerFacet.interface.getFunction("addRewards").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = eigenLayerFacet.interface.getFunction("forceUndelegateRecovery").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  /// ================================= ####### =================================
  /// ================================= ERC4626 =================================
  /// ================================= ####### =================================

  facetId = "2";
  accessId = "0";

  funcSig = ERC4626FacetFactory.interface.getFunction("deposit").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = ERC4626FacetFactory.interface.getFunction("depositWithReferral").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = ERC4626FacetFactory.interface.getFunction("withdraw").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = ERC4626FacetFactory.interface.getFunction("flashWithdraw").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = ERC4626FacetFactory.interface.getFunction("isAbleToRedeem").selector;
  await iVault.setSignature(funcSig, facetId, accessId);

  funcSig = ERC4626FacetFactory.interface.getFunction("redeem").selector;
  await iVault.setSignature(funcSig, facetId, accessId);
}

async function gnosisSafe() {
  // {
  //     to: existing.address,
  //     value: 0,
  //     method: "setPartnersContract",
  //     args: {
  //       newValue: partnersContract,
  //     },
  //   },

  new BatchBuilder("", `${upgradeName}_${address}`, "added pausable functions", provider)
    .addOzUpgrade(proxyAdmin, address, impl)
    .add()
    .save();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
