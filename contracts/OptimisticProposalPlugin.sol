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
contract OptimisticProposalPlugin is ArbitrableProposal, IMembership, PluginUUPSUpgradeable {
    /// @notice The ID of the permission required to call the `rule` function.
    bytes32 public constant RULE_PERMISSION_ID = keccak256("RULE_PERMISSION");

    /// @notice The ID of the permission required to call the `executeProposal` function.
    bytes32 public constant CREATE_PROPOSAL_PERMISSION_ID = keccak256("CREATE_PROPOSAL_PERMISSION");

    /// @notice The ID of the permission required to call the `file` function.
    bytes32 public constant CONFIGURE_PARAMETERS_PERMISSION_ID =
        keccak256("CONFIGURE_PARAMETERS_PERMISSION");

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

    /// @notice Updates the contract state based on the provided key and value (`what`, `value`)
    /// @dev This function is used to update various parameters of the contract such as executionDelay,
    ///      arbitrator, proposalCollateral, metaEvidence, and arbitratorExtraData.
    ///      It requires CONFIGURE_PARAMETERS_PERMISSION_ID authorization.
    /// @param what The key of the parameter to be updated
    /// @param value The new value of the parameter in bytes
    function updateState(
        bytes32 what,
        bytes calldata value
    ) external auth(CONFIGURE_PARAMETERS_PERMISSION_ID) {
        _updateState(what, value);
    }

    /// @notice Creates a new arbitrable proposal with the provided metadata, actions, and allow failure map
    ///         (`_metadata`, `_actions`, `_allowFailureMap`)
    /// @dev This function creates a new proposal and requires CREATE_PROPOSAL_PERMISSION_ID authorization.
    /// @param _metadata The metadata of the proposal in bytes
    /// @param _actions An array of actions to be executed by the proposal
    /// @param _allowFailureMap A bitmap representing which actions are allowed to fail during proposal execution
    function createProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint256 _allowFailureMap
    ) external payable auth(CREATE_PROPOSAL_PERMISSION_ID) {
        _createArbitrableProposal(_metadata, _actions, _allowFailureMap);
    }

    function executeProposal(
        uint256 _proposalId
    ) external returns (bytes[] memory execResults, uint256 failureMap) {
        (execResults, failureMap) = _executeArbitrableProposal(dao(), _proposalId);
    }

    /// @notice Provides a ruling for the specified dispute with the given ruling value (`_disputeID`, `_ruling`)
    /// @dev This function requires RULE_PERMISSION_ID authorization and provides a ruling for the given dispute.
    /// @param _disputeID The ID of the dispute to rule on
    /// @param _ruling The ruling value to be applied to the dispute
    function rule(uint256 _disputeID, uint256 _ruling) external auth(RULE_PERMISSION_ID) {
        _rule(_disputeID, _ruling);
    }

    ///--------------------------------------------------------------------------///
    ///                                 IMembership                              ///
    ///--------------------------------------------------------------------------///

    /// @inheritdoc IMembership
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
