// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {PluginUUPSUpgradeable, IDAO} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";
import {ITemplate} from "./interfaces/ITemplate.sol";

/// @title TEMPLATE_PLUGIN
/// @author DAO Box - 2023
/// @notice A plugin that <does something>.
/// @dev This contract is a template for a plugin
contract TemplatePlugin is ITemplate, PluginUUPSUpgradeable {
    /// @notice The ID of the permission required to call the `sensative` function.
    bytes32 public constant SOME_PERMISSION_ID = keccak256("SOME_PERMISSION");

    /// @notice The number that does something important.
    uint256 private someNumber;

    /// @notice The [ERC-165](https://eips.ethereum.org/EIPS/eip-165) interface ID of the contract.
    bytes4 internal constant TEMPLATE_PLUGIN_INTERFACE_ID =
        this.initialize.selector ^ this.getSomeNumber.selector;

    /// @notice Initializes the component.
    /// @dev This method is required to support [ERC-1822](https://eips.ethereum.org/EIPS/eip-1822).
    /// @param _dao The IDAO interface of the associated DAO.
    /// @param _someNumber A number that does something important
    function initialize(IDAO _dao, uint256 _someNumber) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
        someNumber = _someNumber;
    }

    /// @notice Checks if this or the parent contract supports an interface by its ID.
    /// @param _interfaceId The ID of the interface.
    /// @return Returns `true` if the interface is supported.
    function supportsInterface(
        bytes4 _interfaceId
    ) public view virtual override returns (bool) {
        return
            _interfaceId == TEMPLATE_PLUGIN_INTERFACE_ID ||
            super.supportsInterface(_interfaceId);
    }

    /// @notice Gets the number that does something important.
    /// @return Returns the number that does something important.
    function getSomeNumber() external view returns (uint256) {
        return someNumber;
    }

    /// @notice Does something that requires a permission
    function sensitive(
        IDAO.Action[] calldata _actions
    ) external auth(SOME_PERMISSION_ID) {
        revert("Not implemented.");
    }

    /// @dev This empty reserved space is put in place to allow future versions to add new
    /// variables without shifting down storage in the inheritance chain.
    /// https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
    uint256[49] private __gap;
}
