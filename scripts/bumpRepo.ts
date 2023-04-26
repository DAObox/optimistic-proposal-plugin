import hre from 'hardhat';
import {ethers} from 'ethers';
import {getDeployedContracts, getNetwork, readFile} from '../tasks/helpers';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {uploadToIPFS} from '../utils/ipfs-upload';

const main = async () => {
  // 0. setup
  const [deployer] = await hre.ethers.getSigners();
  const metadataPath = './contracts/metadata';
  const network = getNetwork(hre.network);

  const pluginRepo = PluginRepo__factory.connect(
    getDeployedContracts()[network]['PluginRepo'],
    deployer
  );

  const relese = await pluginRepo.latestRelease();
  const latestVersion = await pluginRepo['getLatestVersion(uint8)'](relese);

  console.log('Repo latestVersion: ', {
    tag: latestVersion.tag,
    pluginSetup: latestVersion.pluginSetup,
  });

  // 1. pin metadata
  const buildMetadataUri = `ipfs://${await uploadToIPFS(
    readFile(`${metadataPath}/build-metadata.json`)!
  )}`;

  const releaseMetadataUri = `ipfs://${await uploadToIPFS(
    readFile(`${metadataPath}/release-metadata.json`)!
  )}`;

  console.log({
    buildMetadataUri,
    releaseMetadataUri,
  });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
