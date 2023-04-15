// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Proposals} from "./Proposals.sol";
import {IArbitrable} from "../interfaces/IArbitrable.sol";
import {IArbitrableProposal} from "../interfaces/IArbitrableProposal.sol";
import {IArbitrator} from "../interfaces/IArbitrator.sol";
import "../types/Types.sol";
import "../types/Errors.sol";

abstract contract ArbitrableProposal is IArbitrableProposal, Proposals, Initializable {
    ///==========================================================================///
    ///                               CONSTANTS                                  ///
    ///==========================================================================///

    /// @notice The constant value representing the proposer winning a dispute.
    uint8 public constant PROPOSER_WINS = 1;

    /// @notice The constant value representing the challenger winning a dispute.
    uint8 public constant CHALLENGER_WINS = 2;

    /// @notice A plain English representation of the ruling options.
    string public constant RULING_OPTIONS = "Execute Transaction;Cancel Transaction";

    ///==========================================================================///
    ///                                   STATE                                  ///
    ///==========================================================================///

    /// @notice A mapping of dispute IDs to proposal IDs.
    mapping(uint256 => uint256) public disputedProposals;

    /// @notice A mapping of proposer addresses to their collateral.
    mapping(address => uint256) public proposerFreeCollateral;

    /// @dev The minimum collateral required for a proposer to create a proposal.
    uint256 public proposalCollateral;

    /// @notice The delay (in seconds) between proposal creation and execution.
    uint256 public executionDelay;

    /// @notice The IArbitrator contract used for dispute resolution.
    IArbitrator public arbitrator;

    /// @notice The extra data used by the arbitrator for dispute resolution.
    bytes public arbitratorExtraData;

    /// @notice metaEvidence Link to the meta=evidence.
    string public metaEvidence;

    function _updateState(bytes32 what, bytes calldata value) internal {
        if (what == "executionDelay") executionDelay = abi.decode(value, (uint256));
        else if (what == "arbitrator") arbitrator = IArbitrator(abi.decode(value, (address)));
        else if (what == "proposalCollateral") proposalCollateral = abi.decode(value, (uint256));
        else if (what == "metaEvidence") metaEvidence = abi.decode(value, (string));
        else if (what == "arbitratorExtraData") arbitratorExtraData = value;
        else revert InvalidParameter(what);
        emit UpdateParameters(what, value);
    }

    function withdrawCollateral(uint256 amount) external payable returns (bool success) {
        uint256 freeCollateral = proposerFreeCollateral[msg.sender];
        if (amount < freeCollateral)
            revert InsufficientCollateral({requested: amount, available: freeCollateral});
        proposerFreeCollateral[msg.sender] -= amount;

        (success, ) = payable(msg.sender).call{value: amount}("");

        if (success) emit CollateralWithdrawn(msg.sender, amount);
    }

    ///==========================================================================///
    ///                                   SETUP                                  ///
    ///==========================================================================///

    /// @notice Initializes the ArbitrableProposal with necessary parameters.
    /// @dev This function should be called within the constructor or initializer of a derived contract.
    /// @param _executionDelay The delay in seconds between a proposal passing and becoming executable.
    /// @param _arbitrator The IArbitrator instance to handle disputes.
    /// @param _proposalCollateral The collateral required for creating a proposal.
    /// @param _metaEvidence The URI of the meta-evidence associated with proposals.
    /// @param _arbitratorExtraData The extra data to be passed to the arbitrator when creating a dispute.
    function __ArbitrableProposal_init(
        uint256 _executionDelay,
        IArbitrator _arbitrator,
        uint256 _proposalCollateral,
        string calldata _metaEvidence,
        bytes calldata _arbitratorExtraData
    ) internal initializer {
        executionDelay = _executionDelay;
        arbitrator = _arbitrator;
        proposalCollateral = _proposalCollateral;
        metaEvidence = _metaEvidence;
        arbitratorExtraData = _arbitratorExtraData;
    }

    ///==========================================================================///
    ///                                   SETUP                                  ///
    ///==========================================================================///

    function _createArbitrableProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint256 _allowFailureMap
    ) internal {
        // 0. Revert if no actions are provided
        if (_actions.length == 0) revert NoActions();

        // 1. update the proposer's free collateral
        proposerFreeCollateral[msg.sender] += msg.value;
        emit CollateralDeposited(msg.sender, msg.value);

        // 2. calculate the required collateral
        uint256 arbitrationCost = arbitrator.arbitrationCost(arbitratorExtraData);
        uint256 requiredCollateral = arbitrationCost + proposalCollateral;

        // 3. revert if the proposer does not have enough collateral
        if (proposerFreeCollateral[msg.sender] < requiredCollateral) {
            revert NotEnoughCollateral({
                required: requiredCollateral,
                provided: proposerFreeCollateral[msg.sender]
            });
        }

        // 4. deduct the required collateral from the proposer's free collatera
        proposerFreeCollateral[msg.sender] -= requiredCollateral;

        // 5. create the proposal
        _createProposal(
            msg.sender,
            proposalCollateral,
            arbitrationCost,
            block.timestamp + executionDelay,
            _metadata,
            _actions,
            _allowFailureMap
        );
    }

    function _executeArbitrableProposal(
        IDAO _dao,
        uint256 _proposalId
    ) external virtual returns (bytes[] memory execResults, uint256 failureMap) {
        ProposalDetails memory proposal = getProposal(_proposalId);

        // Check if the proposal status is Active and current timestamp is greater than or equal to executionFromTime
        if (
            proposal.status != ProposalStatus.Active || block.timestamp < proposal.executionFromTime
        )
            revert ProposalNotExecutable({
                currentTime: block.timestamp,
                executionFromTime: proposal.executionFromTime,
                status: proposal.status
            });

        (execResults, failureMap) = _executeProposal(_dao, _proposalId);
    }

    function cancelProposal(uint256 _proposalId) external {
        // 1. Get the proposal
        ProposalDetails memory proposal = getProposal(_proposalId);

        // 2. Ensure the proposal is active or ruled allowed
        if (
            proposal.status != ProposalStatus.Active ||
            proposal.status != ProposalStatus.RuledAllowed
        ) revert ProposalNotActive(proposal.status);

        // 3. Ensure the caller is the proposer
        if (proposal.proposer != msg.sender)
            revert NotProposer({proposer: proposal.proposer, caller: msg.sender});

        // 4. Update the proposal status to Cancelled
        proposal.status = ProposalStatus.Cancelled;

        // 5. update the proposer free collateral
        proposerFreeCollateral[proposal.proposer] +=
            proposal.proposerCollateral +
            proposal.proposerPaidFees;

        // 6. Emit the ProposalCanceled event
        emit ProposalCanceled(_proposalId);
    }

    ///==========================================================================///
    ///                                   SETUP                                  ///
    ///==========================================================================///

    function challengeProposal(uint256 _proposalId) external payable {
        // 1. Get the proposal from the proposalQueue
        ProposalDetails memory proposal = getProposal(_proposalId);

        // 2. Check if the proposal status is Active
        if (proposal.status != ProposalStatus.Active) revert ProposalNotActive(proposal.status);

        // 3. Calculate arbitration cost
        uint256 arbitrationCost = arbitrator.arbitrationCost(arbitratorExtraData);

        // 4. Check if enough ether has been sent to cover the arbitration cost
        if (msg.value < arbitrationCost)
            revert InsufficientArbitrationFee(arbitrationCost, msg.value);

        // 5. Raise a dispute with the arbitrator
        uint256 disputeId = arbitrator.createDispute{value: arbitrationCost}(
            2,
            arbitratorExtraData
        );

        if (disputedProposals[disputeId] == 0)
            revert DisputeAlreadyCreated({
                disputeId: disputeId,
                proposalId: disputedProposals[disputeId]
            });

        // 6. Map the disputeId to the proposalId
        disputedProposals[disputeId] = _proposalId;

        // 7. Update the proposal status and challenger
        _updateProposal(_proposalId, "status", abi.encode(ProposalStatus.Paused));
        _updateProposal(_proposalId, "disputeStatus", abi.encode(DisputeStatus.DisputeCreated));
        _updateProposal(_proposalId, "disputeId", abi.encode(disputeId));
        _updateProposal(_proposalId, "challenger", abi.encode(msg.sender));
        _updateProposal(_proposalId, "challengerPaidFees", abi.encode(msg.value));
        _updateProposal(_proposalId, "pausedAtTime", abi.encode(block.timestamp));

        // 8. Emit the ProposalDisputed event
        emit ProposalDisputed(_proposalId, disputeId, msg.sender);
    }

    function _submitEvidence(uint256 _disputeId, string memory _evidence) external {
        // 1. Get the proposal
        uint256 proposalId = disputedProposals[_disputeId];
        ProposalDetails memory proposal = getProposal(proposalId);

        // 2. if msg.sender is not the proposer or challenger, revert
        if (msg.sender != proposal.proposer || msg.sender != proposal.challenger)
            revert NotProposerOrChallenger({
                proposer: proposal.proposer,
                challenger: proposal.challenger,
                caller: msg.sender
            });

        // 3. if there is no dispute or the dispute is resolved, revert
        if (
            proposal.disputeStatus == DisputeStatus.NoDispute ||
            proposal.disputeStatus == DisputeStatus.Resolved
        ) revert CanNotSubmitEvidence({disputeStatus: proposal.disputeStatus});

        // 4. submit evidence
        emit Evidence(arbitrator, _disputeId, msg.sender, _evidence);
    }

    function _rule(uint256 _disputeID, uint256 _ruling) internal {
        // 1. Get the proposal
        uint256 proposalId = disputedProposals[_disputeID];
        ProposalDetails memory proposal = getProposal(proposalId);

        // 2. Check if the proposal status is Paused
        if (proposal.disputeStatus != DisputeStatus.DisputeCreated)
            revert ProposalNotPaused(proposal.status);

        if (_ruling == 0) {
            // 2a.1 Arbitrator refused to rule. action is cancled and proposer can withdraw collateral
            proposal.status = ProposalStatus.Cancelled;
            proposerFreeCollateral[proposal.proposer] += proposal.proposerCollateral;

            emit ProposalCanceled(proposalId);
        } else if (_ruling == 1) {
            // 2b.1 Arbitrator ruled in favor of the proposer. Proposal is executed.
            proposal.status = ProposalStatus.RuledAllowed;

            // 2b.2 Run back the proposers p
            proposerFreeCollateral[proposal.proposer] +=
                proposal.proposerCollateral +
                proposal.proposerPaidFees;
            emit ProposalRuled(proposalId, _disputeID, _ruling);
        } else if (_ruling == 2) {
            // 2c.1 Arbitrator ruled in favor of the challenger. Proposal is cancelled.
            proposal.status = ProposalStatus.RuledRejected;

            // 2c.2 slash proposer
            proposerFreeCollateral[proposal.proposer] -= proposal.proposerCollateral;

            // 2c.3 Transfer the collateral to the challenger and refund the challenger for the arbitration fees
            payable(proposal.challenger).transfer(
                proposal.proposerCollateral + proposal.challengerPaidFees
            );
            emit ProposalRuled(proposalId, _disputeID, _ruling);
        } else {
            revert InvalidRuling({ruling: _ruling});
        }
    }
}
