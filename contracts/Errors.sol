// SPDX-License-Identifier: MIT

import {DisputeStatus, OptimisticProposalStatus, OptimisticProposal} from "./Types.sol";

pragma solidity 0.8.17;

contract Errors {
  /// @notice NoActions
  /// @dev Indicates that the submitted proposal has no associated actions.
  error NoActions();

  /// @notice InvalidParameter
  /// @dev Indicates that an invalid parameter was passed to the `file` function.
  /// @param what The name of the invalid parameter.
  error InvalidParameter(bytes32 what);

  /// @notice NotEnoughCollateral
  /// @dev Indicates that the proposer did not provide enough collateral for the proposal.
  /// @param required The required amount of collateral.
  /// @param provided The provided amount of collateral.
  error NotEnoughCollateral(uint256 required, uint256 provided);

  /// @notice NotProposer
  /// @dev Indicates that the function caller is not the proposal's proposer.
  /// @param proposer The address of the proposal's proposer.
  /// @param caller The address of the function caller.
  error NotProposer(address proposer, address caller);

  /// @notice OnlyProposerAllowed
  /// @dev Indicates that only the proposer is allowed to call the function.
  /// @param proposer The address of the proposal's proposer.
  /// @param caller The address of the function caller.
  error OnlyProposerAllowed(address proposer, address caller);

  /// @notice OnlyChallengerAllowed
  /// @dev Indicates that only the challenger is allowed to call the function.
  /// @param challenger The address of the proposal's challenger.
  /// @param caller The address of the function caller.
  error OnlyChallengerAllowed(address challenger, address caller);

  /// @notice OnlyPartyAllowed
  /// @dev Indicates that only the proposer or the challenger is allowed to call the function.
  /// @param proposer The address of the proposal's proposer.
  /// @param challenger The address of the proposal's challenger.
  /// @param caller The address of the function caller.
  error OnlyPartyAllowed(address proposer, address challenger, address caller);

  /// @notice ProposalNotActive
  /// @dev Indicates that the proposal is not in an active state.
  /// @param status The current status of the proposal.
  error ProposalNotActive(OptimisticProposalStatus status);

  error ProposalNotPaused(OptimisticProposalStatus status);

  /// @notice InsufficientArbitrationFee
  /// @dev Indicates that the fee provided for arbitration is insufficient.
  /// @param required The required arbitration fee.
  /// @param provided The provided arbitration fee.
  error InsufficientArbitrationFee(uint256 required, uint256 provided);

  /// @notice ProposalNotExecutable
  /// @dev Indicates that the proposal is not executable due to time constraints or its status.
  /// @param currentTime The current timestamp.
  /// @param executionFromTime The earliest timestamp at which the proposal can be executed.
  /// @param status The current status of the proposal.
  error ProposalNotExecutable(uint256 currentTime, uint256 executionFromTime, OptimisticProposalStatus status);

  /// @notice InsufficientCollateralToWithdraw
  /// @dev Indicates that the proposer does not have enough collateral to withdraw the requested amount.
  /// @param requiredCollateral The required amount of collateral needed to secure the proposer's active proposals.
  /// @param availableCollateral The available amount of collateral that the proposer currently has.
  /// @param requestedAmount The amount of collateral requested to be withdrawn.
  error InsufficientCollateralToWithdraw(
    uint256 requiredCollateral,
    uint256 availableCollateral,
    uint256 requestedAmount
  );

  /// @notice Emitted when attempting to deposit zero collateral, which is not allowed.
  error ZeroCollateralDeposit();

  error DisputeAlreadyCreated(uint256 disputeId, uint256 proposalId);

  error NotProposerOrChallenger(address proposer, address challenger, address caller);

  error CanNotSubmitEvidence(DisputeStatus disputeStatus);
}
