// SPDX-License-Identifier: MIT

import {DisputeStatus, ProposalStatus, ProposalDetails} from "./Types.sol";

pragma solidity 0.8.17;

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
error ProposalNotActive(ProposalStatus status);

error ProposalNotPaused(ProposalStatus status);

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
error ProposalNotExecutable(uint256 currentTime, uint256 executionFromTime, ProposalStatus status);

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

/// @notice Emitted when a dispute has already been created for a proposal
/// @param disputeId The ID of the dispute that has already been created
/// @param proposalId The ID of the proposal for which the dispute is created
error DisputeAlreadyCreated(uint256 disputeId, uint256 proposalId);

/// @notice Emitted when the caller is not the proposer or challenger of a dispute
/// @param proposer The address of the proposer
/// @param challenger The address of the challenger
/// @param caller The address of the caller who is not the proposer or challenger
error NotProposerOrChallenger(address proposer, address challenger, address caller);

/// @notice Emitted when submitting evidence is not allowed due to dispute status
/// @param disputeStatus The current status of the dispute
error CanNotSubmitEvidence(DisputeStatus disputeStatus);

/// @notice Emitted when a proposal update is invalid
/// @param proposalId The ID of the proposal being updated
/// @param what The key of the parameter being updated
/// @param value The value of the parameter being updated
error InvalidProposalUpdate(uint256 proposalId, bytes32 what, bytes value);

/// @notice Emitted when an invalid ruling is encountered
/// @param ruling The invalid ruling value
error InvalidRuling(uint256 ruling);

/// @notice Emitted when the collateral provided is insufficient
/// @param requested The amount of collateral requested
/// @param available The amount of collateral available
error InsufficientCollateral(uint256 requested, uint256 available);
