import {task} from 'hardhat/config';

import {HardhatRuntimeEnvironment} from 'hardhat/types';

task('dao:plugin:install', 'Install a plugin in a DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:plugin:uninstall', 'Uninstall a plugin in a DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:plugin:upgrade', 'Upgrade a plugin in a DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});
