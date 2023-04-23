import {task} from 'hardhat/config';

import {HardhatRuntimeEnvironment} from 'hardhat/types';

task('dao:new:tokenVoting', 'Deploy a new Token Voting DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:new:admin', 'Deploy a new Admin DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:new:lens', 'Deploy a new Lens DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task('dao:new:optimistic', 'Deploy a new Optimistic DAO')
  .addParam('conf', 'The path to the config file')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});
