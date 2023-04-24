import {PluginSetupProcessor__factory} from './../typechain/factories/@aragon/osx/framework/plugin/setup/PluginSetupProcessor__factory';
import {VersionTag} from './../test/helpers/types';
import {
  DAOFactory__factory,
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  activeContractsList,
} from '@aragon/osx-ethers';
import hre from 'hardhat';
import {ethers} from 'ethers';
import {defaultAbiCoder, toUtf8Bytes} from 'ethers/lib/utils';
import {hexToBytes} from '../tasks/helpers';
import {ADDRESS_ZERO} from '../test/unit-tests/common';
async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // ***NOTE*** I am hardcoding to mainnet because im using a fork

  // 0. pin the metadata to ipfs.
  // Technically you dont need to do this you can pass empty strings
  const releaseMetadataURI = `ipfs://`;
  const buildMetadataURI = `ipfs://`;

  // 1. deploy the setup contract
  const SetupFactory = await hre.ethers.getContractFactory(
    'MyPlugin',
    deployer
  );
  const setup = await SetupFactory.deploy();
  await setup.deployed();
  console.log(`Deployed MyPluginSetup at ${setup.address}`);

  // 2. Get the plugin factory address
  const pluginRepoFactoryAddr = activeContractsList.mainnet.PluginRepoFactory;
  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    deployer
  );

  // 3. Create the repo
  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    'my-plugin', // the ens name of the repo: my-plugin.plugin.dao.eth
    setup.address, // the address of the setup contract
    deployer.address, // this address will have rights to update the repo
    toHex(releaseMetadataURI), // need to convert to bytes
    toHex(buildMetadataURI) // need to convert to bytes
  );

  // 4. get the repo address from event logs
  const receipt = await tx.wait();
  const regestryInterface = PluginRepoRegistry__factory.createInterface();
  const topic = regestryInterface.getEventTopic('PluginRepoRegistered');
  const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
  if (!log) throw new Error('UH OH');

  const repoAddress = regestryInterface.parseLog(log).args.pluginRepo;
  const repo = PluginRepo__factory.connect(repoAddress, deployer);
  console.log(`Deployed PluginRepo at ${repo.address}`);

  // 5. Now we have our repo we can install it into a DAO. you can deploy
  // a DAO with your plugin pre installed but we are going to create a DAO
  // first then install our plugin into it later to show the whole work flow
  // you need at least one governance plugin installed in the DAO
  // or the factory will fail. We are going to use the admin plugin as its
  // the simplest one but it wont appear in the UI

  const adminRepo = PluginRepo__factory.connect(
    activeContractsList.mainnet['admin-repo'],
    deployer
  );

  // 6. when installing the plugin we need this setupRef object
  const currentRelease = await adminRepo.latestRelease();
  const latestVersion = await adminRepo['getLatestVersion(uint8)'](
    currentRelease
  );

  const setupRef = {
    pluginSetupRepo: repo.address,
    versionTag: latestVersion.tag,
  };

  // 7. encode the data that will get passed into the `prepareInstallation` function
  // on the plugin setup contract. in this case we are only encoding the admin address quite simple
  // https://github.com/aragon/osx/blob/05eabefd1b1789e71a0654f47d62efce511e7d4b/packages/contracts/src/plugins/governance/admin/AdminSetup.sol#L34
  const prepareInstallationData = defaultAbiCoder.encode(
    ['address'],
    [deployer.address]
  );

  // 8. put it all together
  const installData = {
    pluginSetupRef: setupRef,
    data: hexToBytes(prepareInstallationData),
  };

  // 9. pin the DAOs metadata to IPFS, again you dont need to do this but if you dont your DAO
  // will have no appear in the UI. (this wont anyway but still)
  const daoMetadataURI = `ipfs://`;

  // 10. deploy the DAO
  const daoFactory = DAOFactory__factory.connect(
    activeContractsList.mainnet.DAOFactory,
    deployer
  );
  const daoCreationTx = await daoFactory.createDao(
    {
      metadata: toUtf8Bytes(daoMetadataURI),
      subdomain: 'my-dao-42069-1',
      daoURI: 'https://daobox.app',
      trustedForwarder: `0x${'00'.repeat(20)}`,
    },
    [installData]
  );

  // 11. get the event and log the DAO info
  const daoReceipt = await daoCreationTx.wait();
  const daoInterface = DAOFactory__factory.createInterface();
  const daoTopic = daoInterface.getEventTopic('DAORegistered');
  const daoLog = daoReceipt.logs.find(x => x.topics.indexOf(daoTopic) >= 0);
  if (!daoLog) throw new Error('UH OH');
  const daoAddress = daoInterface.parseLog(daoLog).args.dao;
  console.log(`Deployed DAO at ${daoAddress}`);

  // 12. get the plugin address from the PluginSetupProcessor event
  const pspInterface = PluginSetupProcessor__factory.createInterface();
  const pspTopic = pspInterface.getEventTopic('InstallationApplied');
  const pspLog = daoReceipt.logs.find(x => x.topics.indexOf(pspTopic) >= 0);
  if (!pspLog) throw new Error('UH OH');
  const adminAddress = pspInterface.parseLog(pspLog).args.plugin;
  console.log(`Deployed Plugin at ${adminAddress}`);

  // 13. now we can have a DAO and a plugin we can install something in the DAO
  // this is goign to require a couple of steps. First we need to prepare the
  // installation by calling the `prepareInstallation` function on the plugin setup contract
  // then we need to create a proposal to install the plugin. but since we are using
  // the admin plugin the proposal dosnt require a vote. In the actions we need to
  // first grant the PluginSetupProcessor the ability to install the plugin, then we need
  // install the plugin, finally we remove the permission from the PluginSetupProcessor

  // we did this before for the admin plugin now we are going to do the same for our own
  // plugin. for the sake of this exampleim chucking it all together.

  const opSetupRef = {
    pluginSetupRepo: repo.address,
    versionTag: (
      await repo['getLatestVersion(uint8)'](await repo.latestRelease())
    ).tag,
  };
  const opInstallData = {
    pluginSetupRef: opSetupRef,
    data: hexToBytes(
      defaultAbiCoder.encode(
        ['address', 'uint256', 'uint256', 'string', 'bytes'],
        [`0x${'01'.repeat(20)}`, 123, 456, 'https://testing.com', '0x085750']
      )
    ),
  };
  const pluginProcessor = PluginSetupProcessor__factory.connect(
    activeContractsList.mainnet.PluginSetupProcessor,
    deployer
  );
  const prepareTx = await pluginProcessor.prepareInstallation(
    setup.address,
    opInstallData
  );

  // 14. now we we get the info from the logs, we will need this later to create
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

// HELPERS
function toHex(input: string) {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input));
}
