import { ethers } from "hardhat";

// List of error types from the InceptionOmniVault contract
const errors = [
    "NullParams()",
    "LowerMinAmount(uint256)",
    "OnlyOwnerOrOperator()",
    "ResultISharesZero()",
    "InsufficientCapacity(uint256)",
    "CrossChainAdapterNotSet()",
    "FreeBalanceIsZero()",
    "EthToL1Failed(uint256)",
    "MessageToL1Failed(uint256,uint256)",
    "RatioFeedNotSet()",
    "ParameterExceedsLimits(uint256)",
    "TreasuryUpdated(address)",
    "WithdrawFeeParamsChanged(uint256,uint256,uint256)",
    "DepositBonusParamsChanged(uint256,uint256,uint256)",
    "NameChanged(string,string)",
    "OperatorChanged(address,address)",
    "TargetCapacityChanged(uint256,uint256)",

    // Errors from IInceptionVaultErrors interface
    "TransferAssetFailed(address)",
    "TransferAssetFromFailed(address)",
    "InceptionOnPause()",
    "InconsistentData()",
    "ApproveError()",
    "NotContract()",
    "DepositInconsistentResultedState()",
    "OperatorNotRegistered()",
    "RestakerNotRegistered()",
    "ImplementationNotSet()",
    "OnlyOperatorAllowed()",
    "AlreadyDelegated()",
    "DelegationManagerImmutable()",
    "IsNotAbleToRedeem()",
    "ZeroFlashWithdrawFee()",
    "ExceedsMaxPerDeposit(uint256,uint256)",
    "ExceedsMaxTotalDeposited(uint256,uint256)",
    "NotEigenLayerOperator()",
    "EigenLayerOperatorAlreadyExists()"
];

async function main() {
    console.log("Error Signatures:");

    errors.forEach((error) => {
        // Create the signature for each error
        const signature = ethers.id(error);
        console.log(`${error} => ${signature}`);
    });
}

// Execute the script
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
