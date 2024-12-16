// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ICrossChainBridgeL1} from "./interfaces/ICrossChainBridgeL1.sol";

contract NativeRebalancer is Initializable, Ownable2StepUpgradeable {
    struct L2State {
        uint256 tokenBalance;
        uint256 ethBalance;
    }

    address payable public crossChainAdapter;
    uint256 public syncedSupply;
    mapping(uint256 => L2State) public l2States; // Mapping of chainId to L2 states
    uint256[] public chainIds; // Array to keep track of chainIds

    event L2StateUpdated(
        uint256 chainId,
        uint256 tokenBalance,
        uint256 ethBalance
    );
    event ConsolidatedStateSent(
        uint256 totalTokenBalance,
        uint256 totalEthBalance
    );

    /**
     * @dev Initializes the contract with the cross-chain adapter.
     * @param _crossChainAdapter The address of the cross-chain adapter contract.
     */
    function initialize(address payable _crossChainAdapter) public initializer {
        __Ownable_init(msg.sender);
        require(
            _crossChainAdapter != address(0),
            "Adapter address cannot be zero"
        );
        crossChainAdapter = _crossChainAdapter;
    }

    /**
     * @notice Updates the state of a specific L2 chain.
     * @param chainId The chainId of the L2 network.
     * @param tokenBalance The total token balance on the L2 network.
     * @param ethBalance The total ETH balance on the L2 network.
     */
    function updateL2State(
        uint256 chainId,
        uint256 tokenBalance,
        uint256 ethBalance
    ) external onlyOwner {
        // If this is a new chainId, add it to the chainIds array
        if (
            l2States[chainId].tokenBalance == 0 &&
            l2States[chainId].ethBalance == 0
        ) {
            chainIds.push(chainId);
        }

        // Update the L2 state
        l2States[chainId] = L2State({
            tokenBalance: tokenBalance,
            ethBalance: ethBalance
        });

        emit L2StateUpdated(chainId, tokenBalance, ethBalance);
    }

    /**
     * @notice Deletes the state of a specific L2 chain.
     * @param chainId The chainId of the L2 network to be removed.
     */
    function deleteL2State(uint256 chainId) external onlyOwner {
        delete l2States[chainId];

        // Remove chainId from the chainIds array
        for (uint256 i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == chainId) {
                chainIds[i] = chainIds[chainIds.length - 1];
                chainIds.pop();
                break;
            }
        }
    }

    /**
     * @notice Sends consolidated state information to L1 through the cross-chain adapter.
     * @param options The options for the cross-chain message.
     */
    function sendConsolidatedStateToL1(
        bytes memory options
    ) external payable onlyOwner {
        uint256 totalTokenBalance = 0;
        uint256 totalEthBalance = 0;

        // Consolidate L2 states using the `chainIds` array
        for (uint256 i = 0; i < chainIds.length; i++) {
            uint256 chainId = chainIds[i];
            totalTokenBalance += l2States[chainId].tokenBalance;
            totalEthBalance += l2States[chainId].ethBalance;
        }

        bytes memory payload = abi.encode(totalTokenBalance, totalEthBalance);

        // Quote fees using the cross-chain adapter
        uint256 fees = ICrossChainBridgeL1(crossChainAdapter).quote(
            payload,
            options
        );

        require(msg.value >= fees, "Insufficient fees");

        // Send consolidated data to L1
        ICrossChainBridgeL1(crossChainAdapter).sendDataL1{value: fees}(
            payload,
            options
        );

        emit ConsolidatedStateSent(totalTokenBalance, totalEthBalance);
    }

    /**
     * @notice Fetches all the chainIds currently being tracked.
     * @return The list of chainIds.
     */
    function getChainIds() external view returns (uint256[] memory) {
        return chainIds;
    }

    /**
     * @notice Sets a new cross-chain adapter address.
     * @param _crossChainAdapter The new adapter address.
     */
    function setCrossChainAdapter(
        address payable _crossChainAdapter
    ) external onlyOwner {
        require(
            _crossChainAdapter != address(0),
            "Adapter address cannot be zero"
        );
        crossChainAdapter = _crossChainAdapter;
    }

    /**
     * @notice Receives ETH sent to this contract.
     */
    receive() external payable {}
}
