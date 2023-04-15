// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {ProposalDetails} from "../Types.sol";

/// @title IProposals
/// @notice Interface for Proposals contract
/// @dev This interface defines the functions for a proposal
interface IProposals {
  /// @notice Emitted when a proposal is created
  /// @param proposalId The unique identifier of the proposal (indexed)
  /// @param creator The address of the creator of the proposal (indexed)
  /// @param executionFromTime The earliest timestamp at which the proposal can be executed (indexed)
  /// @param proposerCollateral The proposer's collateral at stake above the fees for a rejected proposal
  /// @param metadata Additional metadata related to the proposal
  /// @param actions An array of IDAO.Action structs containing the actions to be executed as part of the proposal
  /// @param allowFailureMap A map indicating which actions are allowed to fail during execution
  event ProposalCreated(
    uint256 indexed proposalId,
    address indexed creator,
    uint64 indexed executionFromTime,
    uint256 proposerCollateral,
    bytes metadata,
    IDAO.Action[] actions,
    uint256 allowFailureMap
  );

  /// @notice Emitted when a proposal is executed
  /// @param proposalId The ID of the proposal
  event ProposalExecuted(uint256 indexed proposalId);

  /// @notice Returns the number of proposals created
  /// @return count The number of proposals
  function proposalCount() external view returns (uint256 count);

  /// @notice Returns the details of the proposal with the specified ID
  /// @param _proposalId The ID of the proposal
  /// @return proposal The proposal details
  function getProposal(uint256 _proposalId) external view returns (ProposalDetails memory proposal);

  /// @notice Checks if this or the parent contract supports an interface by its ID
  /// @param _interfaceId The ID of the interface
  /// @return supported Returns `true` if the interface is supported
  function supportsInterface(bytes4 _interfaceId) external view returns (bool supported);
}
