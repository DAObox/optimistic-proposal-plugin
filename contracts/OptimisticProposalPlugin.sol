// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeCastUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import {ProposalUpgradeable} from "@aragon/osx/core/plugin/proposal/ProposalUpgradeable.sol";
import {PluginCloneable} from "@aragon/osx/core/plugin/PluginCloneable.sol";
import {IMembership} from "@aragon/osx/core/plugin/membership/IMembership.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

import {DisputeStatus, OptimisticProposalStatus, OptimisticProposal} from "./Types.sol";

import {IArbitrable} from "./interfaces/IArbitrable.sol";
import {IArbitrator} from "./interfaces/IArbitrator.sol";

// TODO:
// payArbitrationFeeByParty()
// raiseDispute() - Im thinking the proposer stake should have the initial dispute fee. baked in to avoid extra step
// timeOutParty()
// submitEvidence()
// appeal()
// executeRulting

/// @title OptimisticProposalPlugin
/// @author DAO Box - 2023
/// @notice A plugin that manages and executes Optimistic Proposals for an Aragon DAO using Kleros as the arbitrator.
contract OptimisticProposalPlugin is IArbitrable, IMembership, PluginCloneable, ProposalUpgradeable {
  using SafeCastUpgradeable for uint256;

  /// @notice The ID of the permission required to call the `rule` function.
  bytes32 public constant RULE_PERMISSION_ID = keccak256("RULE_PERMISSION");

  /// @notice The ID of the permission required to call the `executeProposal` function.
  bytes32 public constant CREATE_PROPOSAL_PERMISSION_ID = keccak256("CREATE_PROPOSAL_PERMISSION");

  /// @notice The ID of the permission required to call the `file` function.
  bytes32 public constant CONFIGURE_FILE_PERMISSION_ID = keccak256("CONFIGURE_FILE_PERMISSION_");

  ///--------------------------------------------------------------------------///
  ///                                ERRORS                                    ///
  ///--------------------------------------------------------------------------///

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

  /// @dev Emitted when attempting to deposit zero collateral, which is not allowed.
  error ZeroCollateralDeposit();

  error DisputeAlreadyCreated(uint256 disputeId, uint256 proposalId);

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

  ///--------------------------------------------------------------------------///
  ///                                STATE                                     ///
  ///--------------------------------------------------------------------------///

  /// @dev The constant value representing the proposer winning a dispute.
  uint8 public constant PROPOSER_WINS = 1;

  /// @dev The constant value representing the challenger winning a dispute.
  uint8 public constant CHALLENGER_WINS = 2;

  /// @dev A plain English representation of the ruling options.
  string public constant RULING_OPTIONS = "Proposer wins;Challenger wins";

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
  mapping(address => uint256) public proposerCollateral;

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
  uint256 public minimumProposerCollateral;

  /// @notice Updates the admin parameters of the contract.
  /// @param what The identifier of the parameter to be updated.
  /// @param value The new value of the parameter.
  /// @dev Requires CONFIGURE_FILE_PERMISSION_ID permission.
  function file(bytes32 what, bytes calldata value) external auth(CONFIGURE_FILE_PERMISSION_ID) {
    if (what == "executionDelay") executionDelay = abi.decode(value, (uint256));
    else if (what == "timeout") timeout = abi.decode(value, (uint256));
    else if (what == "arbitrator") arbitrator = IArbitrator(abi.decode(value, (address)));
    else if (what == "minimumProposerCollateral") minimumProposerCollateral = abi.decode(value, (uint256));
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

  /// @notice Creates a new proposal with the provided metadata and actions.
  /// @param _metadata The metadata associated with the proposal.
  /// @param _actions The actions to be executed if the proposal passes.
  /// @param _allowFailureMap A bit mask representing which actions are allowed to fail during execution.
  /// @dev Requires CREATE_PROPOSAL_PERMISSION_ID permission.
  /// @dev The caller must provide enough collateral based on the number of active proposals they have.
  /// @dev The execution delay is added to the current block timestamp to set the executionFromTime.
  function createProposal(
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap
  ) external payable auth(CREATE_PROPOSAL_PERMISSION_ID) {
    // Calculate the required collateral based on the number of active proposals the sender has
    uint256 requiredCollateral = (activeProposals[msg.sender] + 1) * minimumProposerCollateral;
    uint256 providedCollateral = proposerCollateral[msg.sender] + msg.value;

    // Check if the provided collateral is enough
    if (providedCollateral < requiredCollateral) {
      revert NotEnoughCollateral({required: requiredCollateral, provided: providedCollateral});
    }

    emit CollateralDeposited(msg.sender, msg.value);

    // Update the proposer's collateral and active proposal count
    proposerCollateral[msg.sender] += msg.value;
    activeProposals[msg.sender]++;

    // Revert if no actions are provided
    if (_actions.length == 0) revert NoActions();

    // Generate a new proposal ID
    uint256 proposalId = nextProposalId++;

    // Set the proposal properties
    proposalQueue[proposalId].executionFromTime = uint256(block.timestamp) + executionDelay;
    proposalQueue[proposalId].proposer = msg.sender;
    proposalQueue[proposalId].allowFailureMap = _allowFailureMap;
    proposalQueue[proposalId].metadata = _metadata;
    proposalQueue[proposalId].status = OptimisticProposalStatus.Active;

    // Store the proposal actions
    for (uint256 i = 0; i < _actions.length; i++) {
      proposalActions[proposalId][i] = _actions[i];
    }

    // Emit the ProposalCreated event
    emit ProposalCreated(proposalId, msg.sender, _metadata);
  }

  /// @notice Challenges a proposal by raising a dispute with the arbitrator.
  /// @param _proposalId The ID of the proposal to be challenged.
  /// @dev Requires the challenger to send enough ether to cover the arbitration cost.
  /// @dev The proposal status is changed to Paused, and the challenger and pausedAtTime are updated.
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
    proposal.pausedAtTime = uint256(block.timestamp);
    proposal.disputeId = uint256(disputeId);
    proposal.lastInteraction = uint256(block.timestamp);

    emit HasToPayFee(proposal.proposer);

    // Emit the ProposalDisputed event
    emit ProposalDisputed(_proposalId, disputeId, msg.sender);
  }

  /// @notice Cancels a proposal by changing its status to Cancelled.
  /// @param _proposalId The ID of the proposal to be cancelled.
  /// @dev Only the proposer can cancel a proposal, and it must be in the Active state.
  function cancelProposal(uint256 _proposalId) external {
    // Get the proposal from the proposalQueue
    OptimisticProposal storage proposal = proposalQueue[_proposalId];

    // Check if the proposal status is Active
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

  /// @notice Executes a proposal by calling the DAO's execute function.
  /// @param _proposalId The ID of the proposal to be executed.
  /// @dev The proposal must be in the Active state and the current timestamp must be greater than or equal to the proposal's executionFromTime.
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

    // Get the actions associated with the proposal
    IDAO.Action[] storage actions = proposalActions[_proposalId];

    // Execute the actions by calling the DAO's execute function with the actions and allowFailureMap
    dao().execute(bytes32(block.timestamp), proposalActions[_proposalId], proposal.allowFailureMap);

    // Decrement the active proposals count for the proposer
    activeProposals[proposal.proposer]--;

    // Emit the ProposalExecuted event
    emit ProposalExecuted(_proposalId);
  }

  /// @inheritdoc IArbitrable
  function rule(uint256 _disputeID, uint256 _ruling) external auth(RULE_PERMISSION_ID) {
    revert("Not implemented.");
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

  /// @notice Allows the proposer to withdraw their unused collateral.
  /// @dev Ensures that the proposer cannot withdraw more than is needed to secure their active proposals.
  /// @param amount The amount of collateral to withdraw.
  function withdrawCollateral(uint256 amount) external {
    uint256 requiredCollateral = activeProposals[msg.sender] * minimumProposerCollateral;
    uint256 availableCollateral = proposerCollateral[msg.sender];

    // Check if the proposer has enough collateral to withdraw the requested amount.
    if (amount > availableCollateral - requiredCollateral) {
      revert InsufficientCollateralToWithdraw({
        requiredCollateral: requiredCollateral,
        availableCollateral: availableCollateral,
        requestedAmount: amount
      });
    }

    // Update the proposer's collateral balance and transfer the requested amount.
    proposerCollateral[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);

    emit CollateralWithdrawn(msg.sender, amount);
  }

  /// @notice Allows a proposer to deposit collateral.
  /// @dev Deposits collateral for the proposer to secure their proposals.

  function depositCollateral() external payable {
    if (msg.value == 0) revert ZeroCollateralDeposit();

    proposerCollateral[msg.sender] += msg.value;

    emit CollateralDeposited(msg.sender, msg.value);
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
