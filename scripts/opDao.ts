import {ADDRESS_ZERO} from './../test/unit-tests/common';
import hre, {ethers} from 'hardhat';
import config from '../config-dao';
import {findEventTopicLog, getNetwork, hexToBytes} from '../tasks/helpers';
import {
  DAOFactory,
  DAOFactory__factory,
  DAORegistry__factory,
  PluginRepo__factory,
  activeContractsList,
} from '@aragon/osx-ethers';
import {uploadToIPFS} from '../utils/ipfs-upload';
import {defaultAbiCoder} from '@ethersproject/abi';
import {toUtf8Bytes} from 'ethers/lib/utils';
async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const network = getNetwork(hre.network);

  const daoFactory = DAOFactory__factory.connect(
    activeContractsList[network].DAOFactory,
    deployer
  );
  const repo = PluginRepo__factory.connect(
    '0x00e0b50f1fb27b03de3a6608bb587c8aefd3d69c',
    deployer
  );

  const currentRelease = await repo.latestRelease();
  const latestVersion = await repo['getLatestVersion(uint8)'](currentRelease);

  const deployemnt = defaultAbiCoder.encode(
    ['address', 'uint256', 'uint256', 'string', 'bytes'],
    config.initPayload
  );

  const installData = {
    pluginSetupRef: {
      pluginSetupRepo: repo.address,
      versionTag: latestVersion.tag,
    },
    data: hexToBytes(deployemnt),
  };

  const creationTx = await daoFactory.createDao(
    {
      metadata: toUtf8Bytes(
        `ipfs://${await uploadToIPFS(JSON.stringify(config.metadata))}`
      ),
      subdomain: 'optimistic' + Math.floor(Math.random() * 1000000),
      trustedForwarder: ADDRESS_ZERO,
      daoURI: 'https://daobox.app',
    },
    [installData]
  );

  const txHash = creationTx.hash;
  console.log('txHash', txHash);
  await creationTx.wait();

  const iface = DAORegistry__factory.connect(ADDRESS_ZERO, deployer).interface;

  const {dao, creator, subdomain} = (
    await findEventTopicLog(creationTx, iface, 'DAORegistered')
  ).args;

  console.log({dao, creator, subdomain, txHash, network: hre.network.name});
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
