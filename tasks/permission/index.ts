import {task} from 'hardhat/config';

import {HardhatRuntimeEnvironment} from 'hardhat/types';

task('dao:permission:list', 'List All the permissions in a DAO')
  .addParam('dao', 'The address of the DAO')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:permission:list:plugin', 'List the permissions on a Plugin')
  .addParam('dao', 'The address of the DAO')
  .addParam('plugin', 'The address of the DAO')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:permission:grant', 'Grant a permission in a DAO')
  .addParam('dao', 'The address of the DAO')
  .addParam('permission', 'The permission ID to grant')
  .addParam('on', 'The the Plugin/DAO to grant the permission on')
  .addParam('to', 'The the address to give the permission to')
  .addParam('condition', 'The condition contract for the permission')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:permission:revoke', 'Revoke a permission in a DAO')
  .addParam('dao', 'The address of the DAO')
  .addParam('permission', 'The permission ID to revoke')
  .addParam('on', 'The the Plugin/DAO to revoke the permission on')
  .addParam('to', 'The the address to give the permission to')
  .addParam('condition', 'The condition contract for the permission')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});
