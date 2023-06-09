// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IArbitrable} from "./IArbitrable.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

interface IArbitrableProposal is IArbitrable {
    ///--------------------------------------------------------------------------///
    ///                                EVENTS                                    ///
    ///--------------------------------------------------------------------------///

    /// @dev Emitted when a configuration parameter is updated.
    /// @param what The name of the parameter that was updated.
    /// @param value The new value of the parameter.
    event UpdateParameters(bytes32 what, bytes value);

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
}
