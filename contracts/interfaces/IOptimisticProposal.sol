// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IArbitrable} from "./IArbitrable.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

interface IOptimisticProposal is IArbitrable {
  ///--------------------------------------------------------------------------///
  ///                                EVENTS                                    ///
  ///--------------------------------------------------------------------------///

  /// @dev Emitted when a configuration parameter is updated.
  /// @param what The name of the parameter that was updated.
  /// @param value The new value of the parameter.
  event File(bytes32 what, bytes value);

  /// @dev Emitted when a new proposal is created.
  /// @param proposalId The ID of the newly created proposal.
  /// @param proposer The address of the proposer.
  /// @param metadata The metadata associated with the proposal.
  event ProposalCreated(uint256 proposalId, address proposer, bytes metadata);

  /// @dev Emitted when a party has to pay a fee.
  /// @param party The address of the party.
  event HasToPayFee(address party);

  /// @dev Emitted when a proposal is disputed.
  /// @param proposalId The ID of the disputed proposal.
  /// @param disputeId The ID of the dispute created in the arbitrator.
  /// @param challenger The address of the challenger.
  event ProposalDisputed(uint256 proposalId, uint256 disputeId, address challenger);

  /// @dev Emitted when a proposal is canceled.
  /// @param proposalId The ID of the canceled proposal.
  event ProposalCanceled(uint256 proposalId);

  /// @notice CollateralWithdrawn
  /// @dev Emitted when a proposer withdraws their collateral.
  /// @param proposer The address of the proposer.
  /// @param amount The amount of collateral withdrawn.
  event CollateralWithdrawn(address indexed proposer, uint256 amount);

  /// @notice CollateralDeposited
  /// @dev Emitted when a proposer deposits collateral.
  /// @param proposer The address of the proposer.
  /// @param amount The amount of collateral deposited.
  event CollateralDeposited(address indexed proposer, uint256 amount);

  event ProposalRuled(uint256 proposalId, uint256 disputeID, uint ruling);

  /// @notice Updates the admin parameters of the contract.
  /// @param what The identifier of the parameter to be updated.
  /// @param value The new value of the parameter.
  /// @dev Requires CONFIGURE_FILE_PERMISSION_ID permission.
  function file(bytes32 what, bytes calldata value) external;

  /// @notice Creates a new proposal with the provided metadata and actions.
  /// @param _metadata The metadata associated with the proposal.
  /// @param _actions The actions to be executed if the proposal passes.
  /// @param _allowFailureMap A bit mask representing which actions are allowed to fail during execution.
  /// @dev The caller must provide enough collateral and prefund the proposal with the arbitration cost.
  function createProposal(
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap
  ) external payable;

  /// @notice Challenges a proposal by raising a dispute with the arbitrator.
  /// @param _proposalId The ID of the proposal to be challenged.
  /// @dev Requires the challenger to send enough ether to cover the arbitration cost.
  /// @dev The proposal status is changed to Paused, and the challenger and pausedAtTime are updated.
  function challengeProposal(uint256 _proposalId) external payable;

  /// @notice Cancels a proposal by changing its status to Cancelled.
  /// @param _proposalId The ID of the proposal to be cancelled.
  /// @dev Only the proposer can cancel a proposal, and it must be in the Active or RuledAllowed state.
  function cancelProposal(uint256 _proposalId) external;

  /// @notice Executes a proposal by calling the DAO's execute function.
  /// @param _proposalId The ID of the proposal to be executed.
  /// @dev The proposal must be in the Active state and the current timestamp must be greater than or equal to the proposal's executionFromTime.
  function executeProposal(uint256 _proposalId) external;

  /// @notice Allows a proposer to deposit collateral.
  /// @dev Deposits collateral for the proposer to secure their proposals.
  function depositCollateral() external payable;

  /// @notice Allows the proposer to withdraw their unused collateral.
  /// @dev Ensures that the proposer cannot withdraw more than is needed to secure their active proposals.
  /// @param amount The amount of collateral to withdraw.
  function withdrawCollateral(uint256 amount) external;

  /// @notice Submit a reference to evidence. EVENT.
  /// @param _disputeId The index of the transaction.
  /// @param _evidence A link to an evidence using its URI.
  function submitEvidence(uint256 _disputeId, string memory _evidence) external;

  /// @notice Appeal an appealable ruling.
  ///  @dev Note that no checks are required as the checks are done by the arbitrator.
  ///  @param _disputeId The index of the transaction.
  function appeal(uint256 _disputeId) external payable;
}
