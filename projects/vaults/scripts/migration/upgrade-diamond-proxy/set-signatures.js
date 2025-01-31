const { ethers } = require("hardhat");

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

  console.log(setterFacetFactory.interface.getSighash("setDelegationManager"));

  let facetId = "0";
  let accessId = "2";

  let funcSig = setterFacetFactory.interface.getSighash("setDelegationManager");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setRewardsCoordinator");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("upgradeTo");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setRatioFeed");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("addELOperator");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setTreasuryAddress");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setOperator");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setMinAmount");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setName");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setTargetFlashCapacity");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setProtocolFee");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setDepositBonusParams");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setFlashWithdrawFeeParams");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = setterFacetFactory.interface.getSighash("setRewardsTimeline");
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

  funcSig = eigenLayerFacetFactory.interface.getSighash("delegateToOperator");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getSighash("redelegateToOperator");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getSighash("undelegateFrom");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getSighash("undelegateVault");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getSighash("claimCompletedWithdrawals");
  /// Everyone is able to claim
  // await iVault.setSignature(funcSig, facetId, "0");
  sigs.push(funcSig);
  facetIds.push(facetId);
  accesses.push("0");

  funcSig = eigenLayerFacetFactory.interface.getSighash("updateEpoch");
  // await iVault.setSignature(funcSig, facetId, "0");
  sigs.push(funcSig);
  facetIds.push(facetId);
  accesses.push("0");

  funcSig = eigenLayerFacetFactory.interface.getSighash("addRewards");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = eigenLayerFacetFactory.interface.getSighash("forceUndelegateRecovery");
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

  funcSig = ERC4626FacetFactory.interface.getSighash("deposit");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("mint");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("depositWithReferral");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("withdraw(uint256,address)");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("flashWithdraw");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("isAbleToRedeem");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("redeem(address)");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  funcSig = ERC4626FacetFactory.interface.getSighash("redeem(uint256,address,address)");
  sigs.push(funcSig);
  accesses.push(accessId);
  facetIds.push(facetId);

  return [sigs, accesses, facetIds];
}

module.exports = {
  generateTransactionData,
};

