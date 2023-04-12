// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ITemplate
/// @dev This interface defines the methods that must be implemented by a template  in a smart contract system.
/// @author DAO Box
interface ITemplate {
    /// @dev Returns a uint256 value.
    /// @return The uint256 value returned by the plugin.
    function getSomeNumber() external view returns (uint256);

    /// @dev Initializes the template with the specified DAO instance and someNumber value.
    /// This function must be called by the DAO contract during its initialization process.
    /// @param _dao The DAO instance that is using the template.
    /// @param _someNumber A uint256 value used by the template.
    function initialize(IDAO _dao, uint256 _someNumber) external;
}
