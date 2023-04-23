// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {IArbitrable} from "./interfaces/IArbitrable.sol";

/** @title Centralized Arbitrator
 *  @dev This is a centralized arbitrator deciding alone on the result of disputes. No appeals are possible.
 */
contract CentralizedArbitrator is IArbitrator {
    address public owner = msg.sender;
    uint private arbitrationPrice;
    uint public constant NOT_PAYABLE_VALUE = (2 ** 256 - 2) / 2; // High value to be sure that the appeal is too expensive.
    uint256 public disputeId;

    mapping(uint256 => DisputeStruct) public disputes;

    struct DisputeStruct {
        IArbitrable arbitrated;
        uint choices;
        uint fee;
        uint ruling;
        DisputeStatus status;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Can only be called by the owner.");
        _;
    }

    modifier requireArbitrationFee(bytes memory _extraData) {
        require(msg.value >= arbitrationCost(_extraData), "Not enough ETH");
        _;
    }
    modifier requireAppealFee(uint _disputeID, bytes memory _extraData) {
        require(msg.value >= appealCost(_disputeID, _extraData), "Not enough ETH");
        _;
    }

    /** @dev Constructor. Set the initial arbitration price.
     *  @param _arbitrationPrice Amount to be paid for arbitration.
     */
    constructor(uint _arbitrationPrice) {
        arbitrationPrice = _arbitrationPrice;
        disputeId = 1;
    }

    /** @dev Set the arbitration price. Only callable by the owner.
     *  @param _arbitrationPrice Amount to be paid for arbitration.
     */
    function setArbitrationPrice(uint _arbitrationPrice) public onlyOwner {
        arbitrationPrice = _arbitrationPrice;
    }

    /** @dev Cost of arbitration. Accessor to arbitrationPrice.
     *  @param _extraData Not used by this contract.
     *  @return fee Amount to be paid.
     */
    function arbitrationCost(bytes memory _extraData) public view returns (uint fee) {
        return arbitrationPrice;
    }

    /** @dev Cost of appeal. Since it is not possible, it's a high value which can never be paid.
     *  @param _disputeID ID of the dispute to be appealed. Not used by this contract.
     *  @param _extraData Not used by this contract.
     *  @return fee Amount to be paid.
     */
    function appealCost(uint _disputeID, bytes memory _extraData) public view returns (uint fee) {
        return NOT_PAYABLE_VALUE;
    }

    /** @dev Create a dispute. Must be called by the arbitrable contract.
     *  Must be paid at least arbitrationCost().
     *  @param _choices Amount of choices the arbitrator can make in this dispute. When ruling ruling<=choices.
     *  @param _extraData Can be used to give additional info on the dispute to be created.
     *  @return disputeID ID of the dispute created.
     */
    function createDispute(
        uint _choices,
        bytes memory _extraData
    ) public payable returns (uint disputeID) {
        disputeID = disputeId++;
        disputes[disputeID] = DisputeStruct({
            arbitrated: IArbitrable(msg.sender),
            choices: _choices,
            fee: msg.value,
            ruling: 0,
            status: DisputeStatus.Waiting
        });

        emit DisputeCreation(disputeID, IArbitrable(msg.sender));
    }

    /** @dev Give a ruling. UNTRUSTED.
     *  @param _disputeID ID of the dispute to rule.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 means "Not able/wanting to make a decision".
     */
    function _giveRuling(uint _disputeID, uint _ruling) internal {
        DisputeStruct storage dispute = disputes[_disputeID];
        require(_ruling <= dispute.choices, "Invalid ruling.");
        require(dispute.status != DisputeStatus.Solved, "The dispute must not be solved already.");

        dispute.ruling = _ruling;
        dispute.status = DisputeStatus.Solved;

        payable(msg.sender).transfer(dispute.fee);
        dispute.arbitrated.rule(_disputeID, _ruling);
    }

    /** @dev Give a ruling. UNTRUSTED.
     *  @param _disputeID ID of the dispute to rule.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 means "Not able/wanting to make a decision".
     */
    function giveRuling(uint _disputeID, uint _ruling) public onlyOwner {
        return _giveRuling(_disputeID, _ruling);
    }

    /** @dev Return the status of a dispute.
     *  @param _disputeID ID of the dispute to rule.
     *  @return status The status of the dispute.
     */
    function disputeStatus(uint _disputeID) public view returns (DisputeStatus status) {
        return disputes[_disputeID].status;
    }

    /** @dev Return the ruling of a dispute.
     *  @param _disputeID ID of the dispute to rule.
     *  @return ruling The ruling which would or has been given.
     */
    function currentRuling(uint _disputeID) public view returns (uint ruling) {
        return disputes[_disputeID].ruling;
    }

    function appeal(uint256 _disputeID, bytes calldata _extraData) external payable {
        revert("Not possible to appeal.");
    }

    /**
     * @dev Compute the start and end of the dispute's current or next appeal period, if possible.
     *      If not known or appeal is impossible: should return (0, 0).
     * @param _disputeID ID of the dispute.
     * @return start The start of the period.
     * @return end The end of the period.
     */
    function appealPeriod(uint256 _disputeID) external view returns (uint256 start, uint256 end) {
        return (0, 0);
    }
}
