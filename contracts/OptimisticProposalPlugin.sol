// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProposalUpgradeable} from "@aragon/osx/core/plugin/proposal/ProposalUpgradeable.sol";
import {PluginCloneable} from "@aragon/osx/core/plugin/PluginCloneable.sol";
import {IMembership} from "@aragon/osx/core/plugin/membership/IMembership.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {IArbitrable} from "./interfaces/IArbitrable.sol";
import {IOptimisticProposal} from "./interfaces/IOptimisticProposal.sol";
import {DisputeStatus, OptimisticProposalStatus, OptimisticProposal} from "./Types.sol";

import {Errors} from "./Errors.sol";

// TODO:
// Make clonable but not upgradable
// submitEvidence()
// appeal()

/// @title OptimisticProposalPlugin
/// @author DAO Box - 2023
/// @notice A plugin that manages and executes Optimistic Proposals for an Aragon DAO using Kleros as the arbitrator.
contract OptimisticProposalPlugin is IOptimisticProposal, IMembership, PluginCloneable, ProposalUpgradeable, Errors {
  /// @notice The ID of the permission required to call the `rule` function.
  bytes32 public constant RULE_PERMISSION_ID = keccak256("RULE_PERMISSION");

  /// @notice The ID of the permission required to call the `executeProposal` function.
  bytes32 public constant CREATE_PROPOSAL_PERMISSION_ID = keccak256("CREATE_PROPOSAL_PERMISSION");

  /// @notice The ID of the permission required to call the `file` function.
  bytes32 public constant CONFIGURE_FILE_PERMISSION_ID = keccak256("CONFIGURE_FILE_PERMISSION_");

  ///--------------------------------------------------------------------------///
  ///                                STATE                                     ///
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

  /// @dev A mapping of proposal IDs to OptimisticProposal structs.
  mapping(uint256 => OptimisticProposal) public proposalQueue;

  /// @dev A mapping of proposal IDs to arrays of IDAO.Actions.
  mapping(uint256 => IDAO.Action[]) public proposalActions;

  /// @dev A mapping of dispute IDs to proposal IDs.
  mapping(uint256 => uint256) public disputedProposals;

  /// @dev A mapping of proposer addresses to their collateral.
  mapping(address => uint256) public proposerFreeCollateral;

  /// @dev A mapping of proposer addresses to their active proposal count.
  mapping(address => uint256) public activeProposals;

  ///--------------------------------------------------------------------------///
  ///                              ADMIN FILE                                  ///
  ///--------------------------------------------------------------------------///

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

  /// @inheritdoc IOptimisticProposal
  function file(bytes32 what, bytes calldata value) external auth(CONFIGURE_FILE_PERMISSION_ID) {
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
  ///                                  SETUP                                   ///
  ///--------------------------------------------------------------------------///

  /// @notice Initializes the component.
  /// @dev This method is required to support [ERC-1822](https://eips.ethereum.org/EIPS/eip-1822).
  /// @param _dao The IDAO interface of the associated DAO.
  /// @param _arbitrator the Arbitrator contract
  function initialize(IDAO _dao, IArbitrator _arbitrator) external initializer {
    __PluginCloneable_init(_dao);
    arbitrator = _arbitrator;
  }

  ///--------------------------------------------------------------------------///
  ///                            State Transitions                             ///
  ///--------------------------------------------------------------------------///

  /// @inheritdoc IOptimisticProposal
  function createProposal(
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap
  ) external payable auth(CREATE_PROPOSAL_PERMISSION_ID) {
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
    proposalQueue[proposalId].status = OptimisticProposalStatus.Active;
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

  /// @inheritdoc IOptimisticProposal
  function challengeProposal(uint256 _proposalId) external payable {
    // Get the proposal from the proposalQueue
    OptimisticProposal storage proposal = proposalQueue[_proposalId];

    // Check if the proposal status is Active
    if (proposal.status != OptimisticProposalStatus.Active) revert ProposalNotActive(proposal.status);

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
    proposal.status = OptimisticProposalStatus.Paused;
    proposal.challenger = msg.sender;
    proposal.challengerPaidFees += msg.value;
    proposal.pausedAtTime = block.timestamp;
    proposal.disputeId = uint256(disputeId);
    proposal.lastInteraction = block.timestamp;

    // Emit the ProposalDisputed event
    emit ProposalDisputed(_proposalId, disputeId, msg.sender);
  }

  /// @inheritdoc IOptimisticProposal
  function cancelProposal(uint256 _proposalId) external {
    // Get the proposal from the proposalQueue
    OptimisticProposal storage proposal = proposalQueue[_proposalId];

    // TODO: proposal should be cancellable if it's in the `RuledAllowed` state.
    // It is possible that the transaction may fail due to the time it has taken to resolve the dispute

    if (proposal.status != OptimisticProposalStatus.Active) revert ProposalNotActive(proposal.status);

    // Ensure the caller is the proposer
    if (proposal.proposer != msg.sender) revert NotProposer({proposer: proposal.proposer, caller: msg.sender});

    // Update the proposal status to Cancelled
    proposal.status = OptimisticProposalStatus.Cancelled;

    // Decrement the active proposals count for the proposer
    activeProposals[proposal.proposer]--;

    // Emit the ProposalCanceled event
    emit ProposalCanceled(_proposalId);
  }

  /// @inheritdoc IOptimisticProposal
  function executeProposal(uint256 _proposalId) external {
    // Get the proposal from the proposalQueue
    OptimisticProposal storage proposal = proposalQueue[_proposalId];

    // Check if the proposal status is Active and current timestamp is greater than or equal to executionFromTime
    if (proposal.status != OptimisticProposalStatus.Active || block.timestamp < proposal.executionFromTime)
      revert ProposalNotExecutable({
        currentTime: block.timestamp,
        executionFromTime: proposal.executionFromTime,
        status: proposal.status
      });

    // Execute the actions by calling the DAO's execute function with the actions and allowFailureMap
    dao().execute(bytes32(block.timestamp), proposalActions[_proposalId], proposal.allowFailureMap);

    // Decrement the active proposals count for the proposer
    activeProposals[proposal.proposer]--;

    // Emit the ProposalExecuted event
    emit ProposalExecuted(_proposalId);
  }

  /// @inheritdoc IOptimisticProposal
  function submitEvidence(uint256 _disputeId, string memory _evidence) external {
    // Get the proposal from the proposalQueue
    uint256 proposalId = disputedProposals[_disputeId];
    OptimisticProposal storage proposal = proposalQueue[proposalId];

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

  /// @inheritdoc IOptimisticProposal
  function appeal(uint256 _disputeId) external payable {
    // NOTE: Appeals are not implemented in this version of the contract
    revert("NOT IMPLEMENTED");
  }

  /// @inheritdoc IArbitrable
  function rule(uint256 _disputeID, uint256 _ruling) external auth(RULE_PERMISSION_ID) {
    uint256 proposalId = disputedProposals[_disputeID];
    OptimisticProposal storage proposal = proposalQueue[proposalId];

    // Check if the proposal status is Paused
    if (proposal.status != OptimisticProposalStatus.Paused) revert ProposalNotPaused(proposal.status);

    if (_ruling == 1) {
      // Arbitrator ruled in favor of the proposer. Proposal is executed.
      proposal.status = OptimisticProposalStatus.RuledAllowed;

      // Decrement the active proposals count for the proposer
      activeProposals[proposal.proposer]--;

      emit ProposalRuled(proposalId, _disputeID, _ruling);
    } else if (_ruling == 2) {
      // Arbitrator ruled in favor of the challenger. Proposal is cancelled.
      proposal.status = OptimisticProposalStatus.RuledRejected;

      // Decrement the active proposals count for the proposer
      activeProposals[proposal.proposer]--;

      // slash proposer and Transfer the collateral to the challenger
      proposerFreeCollateral[proposal.proposer] -= proposal.proposerCollateral;
      payable(proposal.challenger).transfer(proposal.proposerCollateral);

      emit ProposalRuled(proposalId, _disputeID, _ruling);
    } else {
      // Arbitrator refused to rule. action is cancled and proposer can withdraw collateral
      proposal.status = OptimisticProposalStatus.Cancelled;

      // Decrement the active proposals count for the proposer
      activeProposals[proposal.proposer]--;

      emit ProposalCanceled(proposalId);
    }
  }

  /// @inheritdoc IOptimisticProposal
  function withdrawCollateral(uint256 amount) external {
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

  /// @inheritdoc IOptimisticProposal
  function depositCollateral() external payable {
    if (msg.value == 0) revert ZeroCollateralDeposit();

    proposerFreeCollateral[msg.sender] += msg.value;

    emit CollateralDeposited(msg.sender, msg.value);
  }

  ///--------------------------------------------------------------------------///
  ///                            PROPOSER FUNCTIONS                            ///
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
      super.supportsInterface(_interfaceId);
  }

  /// @dev This empty reserved space is put in place to allow future versions to add new
  /// variables without shifting down storage in the inheritance chain.
  /// https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[49] private __gap;
}
