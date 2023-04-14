// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IArbitrable} from "./interfaces/IArbitrable.sol";
import {IOptimisticProposal} from "./interfaces/IOptimisticProposal.sol";
import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {DisputeStatus, ProposalStatus, Proposal} from "./Types.sol";
import {Errors} from "./Errors.sol";

abstract contract OptimisticProposal is Initializable, IOptimisticProposal, Errors {
  ///--------------------------------------------------------------------------///
  ///                                   STATE                                  ///
  ///--------------------------------------------------------------------------///
  /// @dev The constant value representing the proposer winning a dispute.
  uint8 public constant PROPOSER_WINS = 1;

  /// @dev The constant value representing the challenger winning a dispute.
  uint8 public constant CHALLENGER_WINS = 2;

  /// @dev A plain English representation of the ruling options.
  string public constant RULING_OPTIONS = "Execute Transaction;Cancel Transaction";

  /// @dev The ID of the next proposal to be created.
  /// @dev The ID should never be 0, as 0 is used to indicate that a proposal does not exist.
  uint256 public nextProposalId;

  /// @dev A mapping of proposal IDs to Proposal structs.
  mapping(uint256 => Proposal) public proposalQueue;

  /// @dev A mapping of proposal IDs to arrays of IDAO.Actions.
  mapping(uint256 => IDAO.Action[]) public proposalActions;

  /// @dev A mapping of dispute IDs to proposal IDs.
  mapping(uint256 => uint256) public disputedProposals;

  /// @dev A mapping of proposer addresses to their collateral.
  mapping(address => uint256) public proposerFreeCollateral;

  /// @dev A mapping of proposer addresses to their active proposal count.
  mapping(address => uint256) public activeProposals;

  /// @dev The delay (in seconds) between proposal creation and execution.
  uint256 public executionDelay;

  /// @dev Time after which a party automatically loose a dispute.
  uint256 public timeout;

  /// @dev The IArbitrator contract used for dispute resolution.
  IArbitrator public arbitrator;

  /// @dev The extra data used by the arbitrator for dispute resolution.
  bytes public arbitratorExtraData;

  /// @dev metaEvidence Link to the meta-evidence.
  string public metaEvidence;

  /// @dev The minimum collateral required for a proposer to create a proposal.
  uint256 public proposalCollateral;

  ///--------------------------------------------------------------------------///
  ///                                   CONFIG                                 ///
  ///--------------------------------------------------------------------------///

  function __OptimisticProposal_init(
    uint256 _executionDelay,
    uint256 _timeout,
    IArbitrator _arbitrator,
    uint256 _proposalCollateral,
    string calldata _metaEvidence,
    bytes calldata _arbitratorExtraData
  ) internal initializer {
    executionDelay = _executionDelay;
    timeout = _timeout;
    arbitrator = _arbitrator;
    proposalCollateral = _proposalCollateral;
    metaEvidence = _metaEvidence;
    arbitratorExtraData = _arbitratorExtraData;
    nextProposalId = 1;
  }

  function _file(bytes32 what, bytes calldata value) internal {
    if (what == "executionDelay") executionDelay = abi.decode(value, (uint256));
    else if (what == "timeout") timeout = abi.decode(value, (uint256));
    else if (what == "arbitrator") arbitrator = IArbitrator(abi.decode(value, (address)));
    else if (what == "proposalCollateral") proposalCollateral = abi.decode(value, (uint256));
    else if (what == "metaEvidence") metaEvidence = abi.decode(value, (string));
    else if (what == "arbitratorExtraData") arbitratorExtraData = value;
    else revert InvalidParameter(what);
    emit File(what, value);
  }

  ///--------------------------------------------------------------------------///
  ///                            IOptimisticProposal                           ///
  ///--------------------------------------------------------------------------///

  function _createProposal(
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
      revert NotEnoughCollateral({required: requiredCollateral, provided: proposerFreeCollateral[msg.sender]});
    }

    // 4. deduct the required collateral from the proposer's free collatera
    proposerFreeCollateral[msg.sender] -= requiredCollateral;

    // 5. Generate a new proposal ID
    uint256 proposalId = nextProposalId++;

    // 6. Set the proposal properties
    proposalQueue[proposalId].status = ProposalStatus.Active;
    proposalQueue[proposalId].disputeStatus = DisputeStatus.NoDispute;
    proposalQueue[proposalId].metadata = _metadata;
    proposalQueue[proposalId].executionFromTime = block.timestamp + executionDelay;
    proposalQueue[proposalId].proposer = msg.sender;
    proposalQueue[proposalId].proposerPaidFees = arbitrationCost;
    proposalQueue[proposalId].proposerCollateral = proposalCollateral;
    proposalQueue[proposalId].allowFailureMap = _allowFailureMap;

    // 7. Store the proposal actions
    for (uint256 i = 0; i < _actions.length; i++) {
      proposalActions[proposalId][i] = _actions[i];
    }

    // 8. increment the proposer's active proposal count
    activeProposals[msg.sender]++;

    // 9. Emit the ProposalCreated event
    emit ProposalCreated(proposalId, msg.sender, _metadata);
  }

  function _challengeProposal(uint256 _proposalId) internal {
    // Get the proposal from the proposalQueue
    Proposal storage proposal = proposalQueue[_proposalId];

    // Check if the proposal status is Active
    if (proposal.status != ProposalStatus.Active) revert ProposalNotActive(proposal.status);

    // Calculate arbitration cost
    uint256 arbitrationCost = arbitrator.arbitrationCost(arbitratorExtraData);

    // Check if enough ether has been sent to cover the arbitration cost
    if (msg.value < arbitrationCost) revert InsufficientArbitrationFee(arbitrationCost, msg.value);

    // Raise a dispute with the arbitrator
    uint256 disputeId = arbitrator.createDispute{value: arbitrationCost}(2, arbitratorExtraData);

    if (disputedProposals[disputeId] == 0)
      revert DisputeAlreadyCreated({disputeId: disputeId, proposalId: disputedProposals[disputeId]});

    // Map the disputeId to the proposalId
    disputedProposals[disputeId] = _proposalId;

    // Update the proposal status and challenger
    proposal.status = ProposalStatus.Paused;
    proposal.challenger = msg.sender;
    proposal.challengerPaidFees += msg.value;
    proposal.pausedAtTime = block.timestamp;
    proposal.disputeId = uint256(disputeId);
    proposal.lastInteraction = block.timestamp;

    // Emit the ProposalDisputed event
    emit ProposalDisputed(_proposalId, disputeId, msg.sender);
  }

  function _cancelProposal(uint256 _proposalId) internal {
    // Get the proposal from the proposalQueue
    Proposal storage proposal = proposalQueue[_proposalId];

    // TODO: proposal should be cancellable if it's in the `RuledAllowed` state.
    // It is possible that the transaction may fail due to the time it has taken to resolve the dispute

    if (proposal.status != ProposalStatus.Active) revert ProposalNotActive(proposal.status);

    // Ensure the caller is the proposer
    if (proposal.proposer != msg.sender) revert NotProposer({proposer: proposal.proposer, caller: msg.sender});

    // Update the proposal status to Cancelled
    proposal.status = ProposalStatus.Cancelled;

    // Decrement the active proposals count for the proposer
    activeProposals[proposal.proposer]--;

    // Emit the ProposalCanceled event
    emit ProposalCanceled(_proposalId);
  }

  function _executeProposal(uint256 _proposalId) internal {
    // Get the proposal from the proposalQueue
    Proposal storage proposal = proposalQueue[_proposalId];

    // Check if the proposal status is Active and current timestamp is greater than or equal to executionFromTime
    if (proposal.status != ProposalStatus.Active || block.timestamp < proposal.executionFromTime)
      revert ProposalNotExecutable({
        currentTime: block.timestamp,
        executionFromTime: proposal.executionFromTime,
        status: proposal.status
      });

    // Execute the actions by calling the DAO's execute function with the actions and allowFailureMap
    _execute(bytes32(block.timestamp), proposalActions[_proposalId], proposal.allowFailureMap);

    // Decrement the active proposals count for the proposer
    activeProposals[proposal.proposer]--;
  }

  function _submitEvidence(uint256 _disputeId, string memory _evidence) internal {
    // Get the proposal from the proposalQueue
    uint256 proposalId = disputedProposals[_disputeId];
    Proposal storage proposal = proposalQueue[proposalId];

    // if msg.sender is not the proposer or challenger, revert
    if (msg.sender != proposal.proposer || msg.sender != proposal.challenger)
      revert NotProposerOrChallenger({
        proposer: proposal.proposer,
        challenger: proposal.challenger,
        caller: msg.sender
      });

    // if there is no dispute or the dispute is resolved, revert
    if (proposal.disputeStatus == DisputeStatus.NoDispute || proposal.disputeStatus == DisputeStatus.Resolved)
      revert CanNotSubmitEvidence({disputeStatus: proposal.disputeStatus});

    emit Evidence(arbitrator, _disputeId, msg.sender, _evidence);
  }

  function _appeal(uint256 _disputeId) internal {
    // NOTE: Appeals are not implemented in this version of the contract
    revert("NOT IMPLEMENTED");
  }

  function _rule(uint256 _disputeID, uint256 _ruling) internal {
    uint256 proposalId = disputedProposals[_disputeID];
    Proposal storage proposal = proposalQueue[proposalId];

    // Check if the proposal status is Paused
    if (proposal.status != ProposalStatus.Paused) revert ProposalNotPaused(proposal.status);

    if (_ruling == 1) {
      // Arbitrator ruled in favor of the proposer. Proposal is executed.
      proposal.status = ProposalStatus.RuledAllowed;

      // Decrement the active proposals count for the proposer
      activeProposals[proposal.proposer]--;

      emit ProposalRuled(proposalId, _disputeID, _ruling);
    } else if (_ruling == 2) {
      // Arbitrator ruled in favor of the challenger. Proposal is cancelled.
      proposal.status = ProposalStatus.RuledRejected;

      // Decrement the active proposals count for the proposer
      activeProposals[proposal.proposer]--;

      // slash proposer and Transfer the collateral to the challenger
      proposerFreeCollateral[proposal.proposer] -= proposal.proposerCollateral;
      payable(proposal.challenger).transfer(proposal.proposerCollateral);

      emit ProposalRuled(proposalId, _disputeID, _ruling);
    } else {
      // Arbitrator refused to rule. action is cancled and proposer can withdraw collateral
      proposal.status = ProposalStatus.Cancelled;

      // Decrement the active proposals count for the proposer
      activeProposals[proposal.proposer]--;

      emit ProposalCanceled(proposalId);
    }
  }

  function _withdrawCollateral(uint256 amount) internal {
    uint256 requiredCollateral = activeProposals[msg.sender] * proposalCollateral;
    uint256 availableCollateral = proposerFreeCollateral[msg.sender];

    // Check if the proposer has enough collateral to withdraw the requested amount.
    if (amount > availableCollateral - requiredCollateral) {
      revert InsufficientCollateralToWithdraw({
        requiredCollateral: requiredCollateral,
        availableCollateral: availableCollateral,
        requestedAmount: amount
      });
    }

    // Update the proposer's collateral balance and transfer the requested amount.
    proposerFreeCollateral[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);

    emit CollateralWithdrawn(msg.sender, amount);
  }

  function _depositCollateral() internal {
    if (msg.value == 0) revert ZeroCollateralDeposit();

    proposerFreeCollateral[msg.sender] += msg.value;

    emit CollateralDeposited(msg.sender, msg.value);
  }

  function _execute(bytes32 _nonce, IDAO.Action[] memory _actions, uint256 _allowFailureMap) internal virtual;
}
