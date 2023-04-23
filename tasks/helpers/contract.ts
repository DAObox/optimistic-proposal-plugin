import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {addDeployedContract} from './file';
import {
  PluginRepoFactory__factory,
  activeContractsList,
} from '@aragon/osx-ethers';
import {Interface, LogDescription} from '@ethersproject/abi';
import {ContractTransaction} from 'ethers';

interface DeployArgs {
  name: string;
  hre: HardhatRuntimeEnvironment;
  log: boolean;
}

export const deploy = async ({hre, name, log = false}: DeployArgs) => {
  const {network, ethers, getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  const SetupFactory = await ethers.getContractFactory(name, deployer);
  const setup = await SetupFactory.deploy();
  setup.deployTransaction.wait();

  console.log(`Deployed ${name} at ${setup.address}`);

  if (log) addDeployedContract(network.name, name, setup.address);

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
