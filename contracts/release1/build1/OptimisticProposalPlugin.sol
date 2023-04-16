// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IDAO, PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";
import {IMembership} from "@aragon/osx/core/plugin/membership/IMembership.sol";

import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {Proposals} from "./base/Proposals.sol";
import {ArbitrableProposal} from "./base/ArbitrableProposal.sol";

/// @title OptimisticProposalPlugin
/// @author Aaron Abu Usama (@pythonpete32)
/// @notice A plugin that manages and executes Optimistic Proposals for an Aragon OSx DAO.
contract OptimisticProposalPlugin is ArbitrableProposal, PluginUUPSUpgradeable {
    /// @notice The ID of the permission required to call the `rule` function.
    bytes32 public constant RULE_PERMISSION_ID = keccak256("RULE_PERMISSION");

    /// @notice The ID of the permission required to call the `executeProposal` function.
    bytes32 public constant CREATE_PROPOSAL_PERMISSION_ID = keccak256("CREATE_PROPOSAL_PERMISSION");

    /// @notice The ID of the permission required to call the `file` function.
    bytes32 public constant CONFIGURE_PARAMETERS_PERMISSION_ID =
        keccak256("CONFIGURE_PARAMETERS_PERMISSION_");

    /// @notice Initializes the component.
    /// @dev This method is required to support [ERC-1822](https://eips.ethereum.org/EIPS/eip-1822).
    /// @param _dao The IDAO interface of the associated DAO.
    /// @param _arbitrator the Arbitrator contract
    function initialize(
        IDAO _dao,
        IArbitrator _arbitrator,
        uint256 _executionDelay,
        uint256 _proposalCollateral,
        string calldata _metaEvidence,
        bytes calldata _arbitratorExtraData
    ) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
        __ArbitrableProposal_init(
            _executionDelay,
            _arbitrator,
            _proposalCollateral,
            _metaEvidence,
            _arbitratorExtraData
        );
    }

    function updateState(
        bytes32 what,
        bytes calldata value
    ) external auth(CONFIGURE_PARAMETERS_PERMISSION_ID) {
        _updateState(what, value);
    }

    function createProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint256 _allowFailureMap
    ) external payable auth(CREATE_PROPOSAL_PERMISSION_ID) {
        _createArbitrableProposal(_metadata, _actions, _allowFailureMap);
    }

    function rule(uint256 _disputeID, uint256 _ruling) external auth(RULE_PERMISSION_ID) {
        _rule(_disputeID, _ruling);
    }

    ///--------------------------------------------------------------------------///
    ///                                 IMembership                              ///
    ///--------------------------------------------------------------------------///

    function isMember(address _account) external view returns (bool) {
        return
            dao().hasPermission({
                _where: address(this),
                _who: _account,
                _permissionId: CREATE_PROPOSAL_PERMISSION_ID,
                _data: bytes("")
            });
    }

    ///--------------------------------------------------------------------------///
    ///                                 EIP-165                                  ///
    ///--------------------------------------------------------------------------///

    /// @notice The interface ID of the contract.
    bytes4 internal constant DISPUTABLE_PLUGIN_INTERFACE_ID =
        this.initialize.selector ^ this.rule.selector;

    /// @notice Checks if this or the parent contract supports an interface by its ID.
    /// @param _interfaceId The ID of the interface.
    /// @return Returns `true` if the interface is supported.
    function supportsInterface(
        bytes4 _interfaceId
    ) public view override(PluginUUPSUpgradeable, Proposals) returns (bool) {
        return
            _interfaceId == DISPUTABLE_PLUGIN_INTERFACE_ID ||
            _interfaceId == type(IMembership).interfaceId ||
            super.supportsInterface(_interfaceId);
    }

    /// @dev This empty reserved space is put in place to allow future versions to add new
    /// variables without shifting down storage in the inheritance chain.
    /// https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
    uint256[49] private __gap;
}
