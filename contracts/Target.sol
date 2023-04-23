pragma solidity ^0.8.17;

/// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract Target {
    string public message;

    constructor() {
        message = "DAO Box!";
    }

    function setMessage(string memory _message) public returns (string memory) {
        message = _message;
        string memory newMessage = message;
        return newMessage;
    }
}
