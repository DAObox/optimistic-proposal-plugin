import releaseMetadata1 from '../../contracts/release1/release-metadata.json';
import buildMetadata from '../../contracts/release1/build1/build-metadata.json';
import {addDeployedContract, getDeployedContracts} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs-upload';
import {uploadToIPFS} from '../../utils/ipfs-upload';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const pluginSetupContractName = 'OptimisticProposalSetup';
const releaseId = 1;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Upload the metadata
  const releaseMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(releaseMetadata1)
  )}`;
  const buildMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(buildMetadata)
  )}`;

  console.log(`Uploaded metadata of release 1: ${releaseMetadataURI}`);
  console.log(`Uploaded metadata of build 2: ${buildMetadataURI}`);

  // Get PluginSetup
  const setupR1B2 = await deployments.get(pluginSetupContractName);

  // Get PluginRepo
  const pluginRepo = PluginRepo__factory.connect(
    getDeployedContracts()[network.name]['PluginRepo'],
    deployer
  );

  // Create Version for Release 1 and Build 2
  await pluginRepo.createVersion(
    releaseId,
    setupR1B2.address,
    toHex(`ipfs://${await uploadToIPFS(JSON.stringify(buildMetadataURI))}`),
    toHex(`ipfs://${await uploadToIPFS(JSON.stringify(releaseMetadataURI))}`)
  );

  addDeployedContract(network.name, pluginSetupContractName, setupR1B2.address);
};

export default func;
func.tags = ['op_build2'];
