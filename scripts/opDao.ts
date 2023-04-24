import {CentralizedArbitrator} from './../typechain/contracts/CentralizedArbitrator';
import {ADDRESS_ZERO} from './../test/unit-tests/common';
import deployedContracts from '../deployed_contracts.json';
import hre, {ethers} from 'hardhat';
import config from '../config-dao';
import {
  addDeployedContract,
  findEventTopicLog,
  getNetwork,
  hexToBytes,
} from '../tasks/helpers';
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
import {PluginSetupProcessor__factory} from '@aragon/osx-ethers';
async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const network = getNetwork(hre.network);
  // const network = 'goerli';

  const daoFactory = DAOFactory__factory.connect(
    activeContractsList[network].DAOFactory,
    deployer
  );

  const repo = PluginRepo__factory.connect(
    deployedContracts[hre.network.name].PluginRepo,
    deployer
  );

  const currentRelease = await repo.latestRelease();
  const latestVersion = await repo['getLatestVersion(uint8)'](currentRelease);

  // deploy the centralised arbitrator
  const CentralizedArbitrator = await ethers.getContractFactory(
    'CentralizedArbitrator',
    deployer
  );
  const arbitrator = await CentralizedArbitrator.deploy(420);
  await arbitrator.deployed();
  addDeployedContract(
    hre.network.name,
    'CentralizedArbitrator',
    arbitrator.address
  );

  const deployemnt = defaultAbiCoder.encode(
    ['address', 'uint256', 'uint256', 'string', 'bytes'],
    ['0x1a205800EA916D38a2B7ED4E32fB82719D72596F', ...config.initPayload] // [arbitrator.address, ...config.initPayload]
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
      subdomain: 'op-daobox-00', //'optimistic' + Math.floor(Math.random() * 1000000),
      trustedForwarder: ADDRESS_ZERO,
      daoURI: 'https://daobox.app',
    },
    [installData],
    {gasLimit: 10000000}
  );

  const txHash = creationTx.hash;
  // console.log('txHash', txHash);
  await creationTx.wait();

  const iface = DAORegistry__factory.connect(ADDRESS_ZERO, deployer).interface;
  console.log({creationTx});
  const {dao, creator, subdomain} = (
    await findEventTopicLog(creationTx, iface, 'DAORegistered')
  ).args;

  const pspInterface = PluginSetupProcessor__factory.createInterface();
  const {plugin} = (
    await findEventTopicLog(creationTx, pspInterface, 'InstallationApplied')
  ).args;

  console.log({
    dao,
    plugin,
    creator,
    subdomain,
    txHash,
    network: hre.network.name,
  });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
