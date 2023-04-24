import {
  networkNameMapping,
  osxContracts,
  findEventTopicLog,
  addDeployedContract,
} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs-upload';

import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Get the plugin factory address
  let pluginRepoFactoryAddr: string;
  if (
    network.name === 'localhost' ||
    network.name === 'hardhat' ||
    network.name === 'coverage'
  ) {
    // TODO allow to select the network used for testing
    pluginRepoFactoryAddr = osxContracts.mainnet.PluginRepoFactory;
    console.log(
      `Using the mainnet PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment testing on network ${network.name}`
    );
  } else {
    pluginRepoFactoryAddr =
      osxContracts[networkNameMapping[network.name]].PluginRepoFactory;

    console.log(
      `Using the ${
        networkNameMapping[network.name]
      } PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment...`
    );
  }

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    deployer
  );
  console.log('here');

  // Upload the metadata
  const releaseMetadataURI = `ipfs://`;
  const buildMetadataURI = `ipfs://`;

  console.log(`Uploaded metadata of release 1: ${releaseMetadataURI}`);
  console.log(`Uploaded metadata of build 1: ${buildMetadataURI}`);

  const pluginName = 'optimistic-proposals';
  const pluginSetupContractName = 'OptimisticProposalSetup';

  const setupR1B1 = await deployments.get(pluginSetupContractName);

  // Create Repo for Release 1 and Build 1
  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    pluginName,
    setupR1B1.address,
    deployer.address,
    toHex(releaseMetadataURI),
    toHex(buildMetadataURI),
    {gasLimit: 2000000}
  );
  const eventLog = await findEventTopicLog(
    tx,
    PluginRepoRegistry__factory.createInterface(),
    'PluginRepoRegistered'
  );
  if (!eventLog) {
    throw new Error('Failed to get PluginRepoRegistered event log');
  }

  const pluginRepo = PluginRepo__factory.connect(
    eventLog.args.pluginRepo,
    deployer
  );

  console.log(
    `"${pluginName}" PluginRepo deployed at: ${pluginRepo.address} with `
  );

  addDeployedContract(network.name, 'PluginRepo', pluginRepo.address);
  addDeployedContract(network.name, pluginSetupContractName, setupR1B1.address);
};

export default func;
func.tags = ['SimpleStoragePluginRepo', 'PublishSimpleStorageR1B2'];
