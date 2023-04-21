import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {addDeployedContract} from './file';
import {
  PluginRepoFactory__factory,
  activeContractsList,
} from '@aragon/osx-ethers';

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
