// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

/// @title DisputeStatus
/// @dev Represents the status of a dispute related to a proposal.
enum DisputeStatus {
  NoDispute, // No dispute exists for the proposal.
  DisputeCreated, // The dispute has been created.
  Resolved // The dispute has been resolved.
}

/// @title ProposalStatus
/// @dev Represents the status of an optimistic proposal.
enum ProposalStatus {
  Active, // A delayed action that is in the queue.
  Paused, // A delayed action that is being challenged.
  Cancelled, // A delayed action that has been cancelled.
  RuledAllowed, // A delayed action that has been ruled allowed by the arbitrator.
  RuledRejected, // A delayed action that has been ruled disallowed by the arbitrator.
  Executed // A delayed action that has been executed.
}

/// @title ProposalDetails
/// @notice A container for proposal-related information.
/// @dev Represents a proposal in an optimistic governance system.
struct ProposalDetails {
  DisputeStatus disputeStatus; // The status of the dispute related to the proposal.
  ProposalStatus status; // The current status of the proposal.
  uint256 executionFromTime; // The earliest timestamp at which the proposal can be executed.
  uint256 pausedAtTime; // The timestamp at which the proposal was paused due to a challenge.
  uint256 disputeId; // The ID of the dispute related to the proposal.
  address proposer; // The address of the proposal's proposer.
  uint256 proposerCollateral; // The proposers collateral at stake above the fees for a rejected proposal
  uint256 proposerPaidFees; // The amount of fees paid by the proposer.
  address challenger; // The address of the proposal's challenger.
  uint256 challengerPaidFees; // The amount of fees paid by the challenger.
  uint256 allowFailureMap; // A map indicating which actions are allowed to fail during execution.
  bytes metadata; // Additional metadata related to the proposal.
  IDAO.Action[] actions;
}
