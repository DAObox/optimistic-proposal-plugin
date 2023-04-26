import {OptimisticProposalSetup} from './../../typechain/contracts/release1/build1/OptimisticProposalSetup';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {addDeployedContract} from './file';
import {
  PluginRepoFactory__factory,
  activeContractsList,
} from '@aragon/osx-ethers';
import {Interface, LogDescription} from '@ethersproject/abi';
import {ContractFactory, ContractTransaction} from 'ethers';

import {OptimisticProposalSetup__factory} from '../../typechain';

interface DeployArgs {
  setup: string;
  plugin: string;
  hre: HardhatRuntimeEnvironment;
  log: boolean;
  verify: boolean;
}

export const deploy = async ({
  hre,
  setup,
  plugin,
  log = false,
  verify = true,
}: DeployArgs) => {
  const {network, ethers} = hre;
  const SetupFactory = await ethers.getContractFactory(setup);
  const setupContract = await SetupFactory.deploy();
  setupContract.deployTransaction.wait();

  const base = await setupContract.implementation();

  console.log(`Deployed ${setup} at ${setupContract.address}`);

  if (log) addDeployedContract(network.name, setup, setupContract.address);
  if (log) addDeployedContract(network.name, plugin, base);

  if (verify) {
    hre.tenderly.verify({
      name: setup,
      address: setupContract.address,
    });

    hre.tenderly.verify({
      name: plugin,
      address: base,
    });
  }

  return setupContract;
};

export const deployOpSetup = async ({hre, log = false, verify = true}: any) => {
  const {network, ethers, getNamedAccounts, deployments} = hre;
  const {deployer} = await getNamedAccounts();
  const deployerAccount = await ethers.getSigner(deployer);
  const name = 'OptimisticProposalSetup';

  // const {deploy} = deployments;

  // const setup = await deploy(name, {
  //   from: deployer,
  //   args: [],
  //   log: true,
  // });

  // const SetupFactory: ContractFactory = ethers.getContractFactory(name);
  // const setup = await SetupFactory.deploy();
  // await setup.deployed();

  const SetupFactory = new OptimisticProposalSetup__factory(deployerAccount); //  ethers.getContractFactory(name, deployer);
  const setup = await SetupFactory.deploy();
  await setup.deployed();

  const opBase = await setup.implementation();

  console.log(`Deployed ${name} at ${setup.address}`);
  console.log(`Deployed OptimisticProposalPlugin at ${opBase}`);

  if (log) addDeployedContract(network.name, name, setup.address);
  if (log)
    addDeployedContract(network.name, 'OptimisticProposalPlugin', opBase);

  if (verify) {
    hre.tenderly.verify({
      name,
      address: setup.address,
    });

    hre.tenderly.verify({
      name: 'OptimisticProposalPlugin',
      address: opBase,
    });
  }

  return setup;
};

export const repoFactory = async (hre: HardhatRuntimeEnvironment) => {
  const {network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  const FORK_NETWORK = process.env.FORK_NETWORK || 'mainnet';

  const address =
    network.name === 'localhost' ||
    network.name === 'hardhat' ||
    network.name === 'coverage'
      ? activeContractsList[FORK_NETWORK as keyof typeof activeContractsList]
          .PluginRepoFactory
      : activeContractsList[network.name as keyof typeof activeContractsList]
          .PluginRepoFactory;

  return PluginRepoFactory__factory.connect(address, deployer);
};

export async function findEventTopicLog(
  tx: ContractTransaction,
  iface: Interface,
  eventName: string
): Promise<LogDescription> {
  const receipt = await tx.wait();
  const topic = iface.getEventTopic(eventName);
  const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
  if (!log) {
    throw new Error(`No logs found for this event ${eventName} topic.`);
  }
  return iface.parseLog(log);
}
