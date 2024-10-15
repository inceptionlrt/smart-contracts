// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "./interfaces/IProtocolConfig.sol";

/**
 * @title Basic layout with common variables and modifiers from config
 * @author InceptionLRT V2
 */
abstract contract Configurable is Initializable, ContextUpgradeable {
    error OnlyGovernanceAllowed();
    error OnlyOperatorAllowed();
    error OnlyMinterAllowed();

    IProtocolConfig private _config;
    uint256[50 - 1] private __reserved;

    modifier onlyGovernance() virtual {
        if (_msgSender() != _config.getGovernance()) {
            revert OnlyGovernanceAllowed();
        }
        _;
    }

    modifier onlyOperator() virtual {
        if (_msgSender() != _config.getOperator()) {
            revert OnlyOperatorAllowed();
        }
        _;
    }

    modifier onlyMinter() virtual {
        if (
            (_msgSender() != address(_config.getRestakingPool()) &&
                (_msgSender() != address(_config.getRebalancer())))
        ) {
            revert OnlyMinterAllowed();
        }
        _;
    }

    function __Configurable_init(
        IProtocolConfig config_
    ) internal onlyInitializing {
        _config = config_;
    }

    function config() public view virtual returns (IProtocolConfig) {
        return _config;
    }
}
