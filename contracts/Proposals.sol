// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import {IProposals} from "./interfaces/IProposals.sol";
import {ProposalDetails, ProposalStatus, DisputeStatus} from "./Types.sol";
import {InvalidProposalUpdate} from "./Errors.sol";

/// @title Proposals
/// @author Aaron Abu Usama (@pythonpete32)
/// @notice A contract for managing proposals in a DAO using AragonOSx
abstract contract Proposals is IProposals, ERC165 {
  using Counters for Counters.Counter;

  /// @notice The incremental ID for proposals and executions.
  Counters.Counter private proposalCounter;

  /// @notice A mapping of proposal IDs to ProposalDetails structs.
  mapping(uint256 => ProposalDetails) private proposals;

  /// @notice Creates a proposal ID.
  /// @dev The proposal ID is incremented first as 0 indicates no proposal.
  /// @return proposalId The proposal ID.
  function _createProposalId() internal returns (uint256 proposalId) {
    proposalCounter.increment();
    proposalId = proposalCount();
  }

  /// @notice Returns the current number of proposals.
  /// @return The total number of proposals.
  function proposalCount() public view returns (uint256) {
    return proposalCounter.current();
  }

  /// @notice Creates a new proposal with the given details.
  /// @dev Internal function called by derived contracts to create a proposal.
  /// @param _proposer The address of the proposer.
  /// @param _proposerCollateral The amount of collateral provided by the proposer.
  /// @param _proposerPaidFees The amount of fees paid by the proposer.
  /// @param _executionFromTime The timestamp from which the proposal can be executed.
  /// @param _metadata The metadata associated with the proposal.
  /// @param _actions The array of actions to be executed if the proposal is approved.
  /// @param _allowFailureMap The bit map indicating which actions are allowed to fail.
  /// @return proposalId The ID of the newly created proposal.
  function _createProposal(
    address _proposer,
    uint256 _proposerCollateral,
    uint256 _proposerPaidFees,
    uint256 _executionFromTime,
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap
  ) internal returns (uint256 proposalId) {
    // 1. Create proposal
    proposalId = _createProposalId();
    ProposalDetails storage proposal_ = proposals[proposalId];

    // 2. Set proposal details
    proposal_.proposer = _proposer;
    proposal_.proposerCollateral = _proposerCollateral;
    proposal_.proposerPaidFees = _proposerPaidFees;
    proposal_.executionFromTime = _executionFromTime;
    proposal_.metadata = _metadata;
    proposal_.status = ProposalStatus.Active;
    proposal_.disputeStatus = DisputeStatus.NoDispute;

    // 3. Reduce costs
    if (_allowFailureMap != 0) {
      proposal_.allowFailureMap = _allowFailureMap;
    }

    for (uint256 i; i < _actions.length; ) {
      proposal_.actions.push(_actions[i]);
      unchecked {
        ++i;
      }
    }

    // 4. Emit event
    emit ProposalCreated(
      proposalId,
      _proposer,
      uint64(_executionFromTime),
      _proposerCollateral,
      _metadata,
      _actions,
      _allowFailureMap
    );
  }

  /// @notice Retrieves the proposal details for the given proposal ID.
  /// @param _proposalId The ID of the proposal to retrieve the details for.
  /// @return The ProposalDetails struct containing the details of the specified proposal.
  function getProposal(uint256 _proposalId) public view returns (ProposalDetails memory) {
    return proposals[_proposalId];
  }

  /// @notice Updates the specified proposal's field with the provided value.
  /// @dev The function reverts if the field to update is not valid.
  /// @param _proposalId The ID of the proposal to update.
  /// @param _what The field to update within the proposal.
  /// @param _value The new value to be set for the specified field.
  function _updateProposal(uint256 _proposalId, bytes32 _what, bytes memory _value) internal {
    ProposalDetails storage proposal = proposals[_proposalId];
    if (_what == "disputeStatus") proposal.disputeStatus = DisputeStatus(abi.decode(_value, (uint256)));
    else if (_what == "status") proposal.status = ProposalStatus(abi.decode(_value, (uint256)));
    else if (_what == "executionFromTime") proposal.executionFromTime = abi.decode(_value, (uint256));
    else if (_what == "pausedAtTime") proposal.pausedAtTime = abi.decode(_value, (uint256));
    else if (_what == "disputeId") proposal.disputeId = abi.decode(_value, (uint256));
    else if (_what == "proposer") proposal.proposer = abi.decode(_value, (address));
    else if (_what == "proposerCollateral") proposal.proposerCollateral = abi.decode(_value, (uint256));
    else if (_what == "proposerPaidFees") proposal.proposerPaidFees = abi.decode(_value, (uint256));
    else if (_what == "challenger") proposal.challenger = abi.decode(_value, (address));
    else if (_what == "challengerPaidFees") proposal.challengerPaidFees = abi.decode(_value, (uint256));
    else revert InvalidProposalUpdate({proposalId: _proposalId, what: _what, value: _value});
  }

  /// @notice Internal function to execute a proposal.
  /// @param _dao The DAO to execute the proposal on.
  /// @param _proposalId The ID of the proposal to be executed.
  /// @return execResults The array with the results of the executed actions.
  /// @return failureMap The failure map encoding which actions have failed.
  function _executeProposal(
    IDAO _dao,
    uint256 _proposalId
  ) internal virtual returns (bytes[] memory execResults, uint256 failureMap) {
    ProposalDetails storage proposal = proposals[_proposalId];

    (execResults, failureMap) = _dao.execute(bytes32(_proposalId), proposal.actions, proposal.allowFailureMap);
    emit ProposalExecuted({proposalId: _proposalId});
  }

  /// @notice Checks if this or the parent contract supports an interface by its ID.
  /// @param _interfaceId The ID of the interface.
  /// @return Returns `true` if the interface is supported.
  function supportsInterface(bytes4 _interfaceId) public view virtual override(IProposals, ERC165) returns (bool) {
    return _interfaceId == type(IProposals).interfaceId || super.supportsInterface(_interfaceId);
  }
}
