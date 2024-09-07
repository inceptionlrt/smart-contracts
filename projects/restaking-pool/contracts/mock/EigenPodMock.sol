// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "../interfaces/IEigenPod.sol";
import "../interfaces/IETHPOSDeposit.sol";
import "hardhat/console.sol";

contract EigenPodMock is Initializable, IEigenPod {
    address public podOwner;
    bool public hasRestaked;

    IETHPOSDeposit internal ethPOS;
    address public delayedWithdrawalRouter;
    IEigenPodManager public eigenPodManager;
    uint256 public REQUIRED_BALANCE_WEI;
    uint64 public REQUIRED_BALANCE_GWEI;
    uint256 public constant GWEI_TO_WEI = 1e9;

    constructor(
        IETHPOSDeposit _ethPOS,
        address _delayedWithdrawalRouter,
        IEigenPodManager _eigenPodManager,
        uint256 _REQUIRED_BALANCE_WEI
    ) {
        ethPOS = _ethPOS;
        delayedWithdrawalRouter = _delayedWithdrawalRouter;
        eigenPodManager = _eigenPodManager;
        REQUIRED_BALANCE_WEI = _REQUIRED_BALANCE_WEI;
        REQUIRED_BALANCE_GWEI = uint64(_REQUIRED_BALANCE_WEI / GWEI_TO_WEI);
        require(
            _REQUIRED_BALANCE_WEI % GWEI_TO_WEI == 0,
            "EigenPod.contructor: _REQUIRED_BALANCE_WEI is not a whole number of gwei"
        );
        _disableInitializers();
    }

    /// @notice Used to initialize the pointers to addresses crucial to the pod's functionality. Called on construction by the EigenPodManager.
    function initialize(address _podOwner) external initializer {
        require(
            _podOwner != address(0),
            "EigenPod.initialize: podOwner cannot be zero address"
        );
        podOwner = _podOwner;
    }

    function withdrawableRestakedExecutionLayerGwei()
        external
        view
        override
        returns (uint64)
    {}

    function validatorPubkeyHashToInfo(
        bytes32 validatorPubkeyHash
    ) external view override returns (ValidatorInfo memory) {}

    function validatorStatus(
        bytes32 pubkeyHash
    ) external view override returns (VALIDATOR_STATUS) {}

    function verifyWithdrawalCredentials(
        uint64 oracleTimestamp,
        BeaconChainProofs.StateRootProof calldata stateRootProof,
        uint40[] calldata validatorIndices,
        bytes[] calldata withdrawalCredentialProofs,
        bytes32[][] calldata validatorFields
    ) external override {}

    function recoverTokens(
        IERC20[] memory tokenList,
        uint256[] memory amountsToWithdraw,
        address recipient
    ) external override {}

    function stake(
        bytes calldata pubkey,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable override {}

    function withdrawRestakedBeaconChainETH(
        address recipient,
        uint256 amount
    ) external override {}

    function validatorPubkeyToInfo(
        bytes calldata validatorPubkey
    ) external view override returns (ValidatorInfo memory) {}

    function validatorStatus(
        bytes calldata validatorPubkey
    ) external view override returns (VALIDATOR_STATUS) {}

    function startCheckpoint(bool revertIfNoBalance) external override {}

    function verifyCheckpointProofs(
        BeaconChainProofs.BalanceContainerProof calldata balanceContainerProof,
        BeaconChainProofs.BalanceProof[] calldata proofs
    ) external override {}

    function verifyStaleBalance(
        uint64 beaconTimestamp,
        BeaconChainProofs.StateRootProof calldata stateRootProof,
        BeaconChainProofs.ValidatorProof calldata proof
    ) external override {}

    function setProofSubmitter(address newProofSubmitter) external override {}

    function proofSubmitter() external view override returns (address) {}

    function activeValidatorCount() external view override returns (uint256) {}

    function lastCheckpointTimestamp()
        external
        view
        override
        returns (uint64)
    {}

    function currentCheckpointTimestamp()
        external
        view
        override
        returns (uint64)
    {}

    function currentCheckpoint()
        external
        view
        override
        returns (Checkpoint memory)
    {}

    function checkpointBalanceExitedGwei(
        uint64
    ) external view override returns (uint64) {}

    function getParentBlockRoot(
        uint64 timestamp
    ) external view override returns (bytes32) {}
}
