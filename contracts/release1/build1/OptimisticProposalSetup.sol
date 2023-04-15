// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {PluginSetup, IPluginSetup} from "@aragon/osx/framework/plugin/setup/PluginSetup.sol";

import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {DAO} from "@aragon/osx/core/dao/DAO.sol";
import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {OptimisticProposalPlugin} from "./OptimisticProposalPlugin.sol";

/// @title TemplatePluginSetup
/// @author DAO BOX
/// @notice The setup contract of the `OptimisticProposalPlugin` contract.
contract OptimisticProposalSetup is PluginSetup {
    /// @notice The address of the `OptimisticProposalPlugin` base contract.
    OptimisticProposalPlugin private immutable optimisticProposals;

    /// @notice The error thrown when the helpers array length is not x.
    error WrongHelpersArrayLength(uint length);

    /// @notice The contract constructor, that deployes the bases.
    constructor() {
        optimisticProposals = new OptimisticProposalPlugin();
    }

    /// @inheritdoc IPluginSetup
    function prepareInstallation(
        address _dao,
        bytes calldata _data
    ) external returns (address plugin, PreparedSetupData memory preparedSetupData) {
        // Decode `_data` to extract the params needed for deploying and initializing `OptimisticProposalPlugin` plugin,
        // and the required helpers
        (
            IArbitrator arbitrator,
            uint256 executionDelay,
            uint256 proposalCollateral,
            string memory metaEvidence,
            bytes memory arbitratorExtraData
        ) = abi.decode(_data, (IArbitrator, uint256, uint256, string, bytes));

        // Prepare and deploy plugin proxy.
        plugin = createERC1967Proxy(
            address(optimisticProposals),
            abi.encodeWithSelector(
                OptimisticProposalPlugin.initialize.selector,
                _dao,
                arbitrator,
                executionDelay,
                proposalCollateral,
                metaEvidence,
                arbitratorExtraData
            )
        );

        // Prepare permissions
        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](4);

        // Revoke the Arbitrator contract `RULE_PERMISSION_ID` of the plugin.
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            plugin,
            address(arbitrator),
            PermissionLib.NO_CONDITION,
            optimisticProposals.RULE_PERMISSION_ID()
        );

        // Revoke the DAO contract `CREATE_PROPOSAL_PERMISSION_ID` of the plugin.
        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            plugin,
            address(_dao),
            PermissionLib.NO_CONDITION,
            optimisticProposals.CREATE_PROPOSAL_PERMISSION_ID()
        );

        // Revoke the DAO contract `CONFIGURE_PARAMETERS_PERMISSION_ID` of the plugin.
        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            plugin,
            address(_dao),
            PermissionLib.NO_CONDITION,
            optimisticProposals.CONFIGURE_PARAMETERS_PERMISSION_ID()
        );

        // Revoke `EXECUTE_PERMISSION` of the DAO to the plugin.
        permissions[3] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _dao,
            plugin,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).EXECUTE_PERMISSION_ID()
        );

        preparedSetupData.permissions = permissions;
    }

    /// @inheritdoc IPluginSetup
    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    ) external view returns (PermissionLib.MultiTargetPermission[] memory permissions) {
        // Prepare permissions.

        permissions = new PermissionLib.MultiTargetPermission[](3);

        // Grant the Arbitrator contract `RULE_PERMISSION_ID` of the plugin.
        // permissions[0] = PermissionLib.MultiTargetPermission(
        //   PermissionLib.Operation.Grant,
        //   _payload.plugin,
        //   arbitrator,
        //   PermissionLib.NO_CONDITION,
        //   optimisticProposals.RULE_PERMISSION_ID()
        // );

        // Grant the DAO contract `CREATE_PROPOSAL_PERMISSION_ID` of the plugin.
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _payload.plugin,
            address(_dao),
            PermissionLib.NO_CONDITION,
            optimisticProposals.CREATE_PROPOSAL_PERMISSION_ID()
        );

        // Grant the DAO contract `CONFIGURE_PARAMETERS_PERMISSION_ID` of the plugin.
        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _payload.plugin,
            address(_dao),
            PermissionLib.NO_CONDITION,
            optimisticProposals.CONFIGURE_PARAMETERS_PERMISSION_ID()
        );

        // Grant `EXECUTE_PERMISSION` of the DAO to the plugin.
        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _dao,
            _payload.plugin,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).EXECUTE_PERMISSION_ID()
        );
    }

    /// @inheritdoc IPluginSetup
    function implementation() external view virtual override returns (address) {
        return address(optimisticProposals);
    }
}
