// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProposalUpgradeable} from "@aragon/osx/core/plugin/proposal/ProposalUpgradeable.sol";
import {PluginCloneable} from "@aragon/osx/core/plugin/PluginCloneable.sol";
import {IMembership} from "@aragon/osx/core/plugin/membership/IMembership.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {IArbitrable} from "./interfaces/IArbitrable.sol";
import {IOptimisticProposal} from "./interfaces/IOptimisticProposal.sol";
import {DisputeStatus, ProposalStatus, Proposal} from "./Types.sol";
import {OptimisticProposal} from "./OptimisticProposal.sol";

/// @title OptimisticProposalPlugin
/// @author DAO Box - 2023
/// @notice A plugin that manages and executes Optimistic Proposals for an Aragon DAO using Kleros as the arbitrator.
contract OptimisticProposalPlugin is OptimisticProposal, IMembership, PluginCloneable, ProposalUpgradeable {
  /// @notice The ID of the permission required to call the `rule` function.
  bytes32 public constant RULE_PERMISSION_ID = keccak256("RULE_PERMISSION");

  /// @notice The ID of the permission required to call the `executeProposal` function.
  bytes32 public constant CREATE_PROPOSAL_PERMISSION_ID = keccak256("CREATE_PROPOSAL_PERMISSION");

  /// @notice The ID of the permission required to call the `file` function.
  bytes32 public constant CONFIGURE_FILE_PERMISSION_ID = keccak256("CONFIGURE_FILE_PERMISSION_");

  ///--------------------------------------------------------------------------///
  ///                                  SETUP                                   ///
  ///--------------------------------------------------------------------------///

  /// @notice Initializes the component.
  /// @dev This method is required to support [ERC-1822](https://eips.ethereum.org/EIPS/eip-1822).
  /// @param _dao The IDAO interface of the associated DAO.
  /// @param _arbitrator the Arbitrator contract
  function initialize(
    IDAO _dao,
    IArbitrator _arbitrator,
    uint256 _executionDelay,
    uint256 _timeout,
    uint256 _proposalCollateral,
    string calldata _metaEvidence,
    bytes calldata _arbitratorExtraData
  ) external initializer {
    __PluginCloneable_init(_dao);
    __OptimisticProposal_init(
      _executionDelay,
      _timeout,
      _arbitrator,
      _proposalCollateral,
      _metaEvidence,
      _arbitratorExtraData
    );
  }

  ///--------------------------------------------------------------------------///
  ///                            OptimisticProposal                            ///
  ///--------------------------------------------------------------------------///

  /// @inheritdoc IOptimisticProposal
  function file(bytes32 what, bytes calldata value) external auth(CONFIGURE_FILE_PERMISSION_ID) {
    _file(what, value);
  }

  /// @inheritdoc IOptimisticProposal
  function createProposal(
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap
  ) external payable auth(CREATE_PROPOSAL_PERMISSION_ID) {
    _createProposal(_metadata, _actions, _allowFailureMap);
  }

  /// @inheritdoc IOptimisticProposal
  function challengeProposal(uint256 _proposalId) external payable {
    _challengeProposal(_proposalId);
  }

  /// @inheritdoc IOptimisticProposal
  function cancelProposal(uint256 _proposalId) external {
    _cancelProposal(_proposalId);
  }

  /// @inheritdoc IOptimisticProposal
  function executeProposal(uint256 _proposalId) external {
    _executeProposal(_proposalId);
  }

  /// @inheritdoc IOptimisticProposal
  function submitEvidence(uint256 _disputeId, string memory _evidence) external {
    _submitEvidence(_disputeId, _evidence);
  }

  /// @inheritdoc IOptimisticProposal
  function appeal(uint256 _disputeId) external payable {
    _appeal(_disputeId);
  }

  /// @inheritdoc IArbitrable
  function rule(uint256 _disputeID, uint256 _ruling) external auth(RULE_PERMISSION_ID) {
    _rule(_disputeID, _ruling);
  }

  /// @inheritdoc IOptimisticProposal
  function withdrawCollateral(uint256 amount) external {
    _withdrawCollateral(amount);
  }

  /// @inheritdoc IOptimisticProposal
  function depositCollateral() external payable {
    _depositCollateral();
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

  function _execute(bytes32 _nonce, IDAO.Action[] memory _actions, uint256 _allowFailureMap) internal override {
    dao().execute(_nonce, _actions, _allowFailureMap);
  }

  ///--------------------------------------------------------------------------///
  ///                                 EIP-165                                  ///
  ///--------------------------------------------------------------------------///

  /// @notice The interface ID of the contract.
  bytes4 internal constant DISPUTABLE_PLUGIN_INTERFACE_ID = this.initialize.selector ^ this.rule.selector;

  /// @notice Checks if this or the parent contract supports an interface by its ID.
  /// @param _interfaceId The ID of the interface.
  /// @return Returns `true` if the interface is supported.
  function supportsInterface(
    bytes4 _interfaceId
  ) public view override(PluginCloneable, ProposalUpgradeable) returns (bool) {
    return
      _interfaceId == DISPUTABLE_PLUGIN_INTERFACE_ID ||
      _interfaceId == type(IMembership).interfaceId ||
      _interfaceId == type(IOptimisticProposal).interfaceId ||
      super.supportsInterface(_interfaceId);
  }

  /// @dev This empty reserved space is put in place to allow future versions to add new
  /// variables without shifting down storage in the inheritance chain.
  /// https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[49] private __gap;
}
