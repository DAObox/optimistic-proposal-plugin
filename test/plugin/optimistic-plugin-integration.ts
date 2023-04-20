import buildMetadata from '../../contracts/build-metadata.json';
import releaseMetadata from '../../contracts/release-metadata.json';
import {
  DAO,
  PluginRepo,
  PluginSetupProcessor,
  OptimisticProposalPlugin,
  OptimisticProposalPlugin__factory,
  OptimisticProposalSetup,
  OptimisticProposalSetup__factory,
} from '../../typechain';
import {PluginSetupRefStruct} from '../../typechain/@aragon/osx/framework/plugin/setup/PluginSetupProcessor';
import {findEventTopicLog, osxContracts} from '../../utils/helpers';
import {toHex, uploadToIPFS} from '../../utils/ipfs-upload';
import {installPLugin, uninstallPLugin} from '../helpers/setup';
import {deployTestDao} from '../helpers/test-dao';
import {createPluginSetupProcessor} from '../helpers/test-psp';
import {ADDRESS_ONE} from './common';
import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

describe('Optimistic Proposal Integration', function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let pluginRepo: PluginRepo;
  let psp: PluginSetupProcessor;

  let op_setup: OptimisticProposalSetup;

  let plugin_setup: PluginSetupRefStruct;

  before(async () => {
    signers = await ethers.getSigners();

    // Deploy DAO.
    dao = await deployTestDao(signers[0]);

    // Deploy setups.
    // simpleStorageR1B1Setup = await new SimpleStorageR1B1Setup__factory(
    //   signers[0]
    // ).deploy();
    op_setup = await new OptimisticProposalSetup__factory(signers[0]).deploy();

    // Create the plugin repo

    pluginRepo = await populateSimpleStoragePluginRepo(
      signers[0],
      osxContracts.goerli.PluginRepoFactory,
      'optimistic-proposal',
      [op_setup.address]
    );

    plugin_setup = {
      versionTag: {
        release: BigNumber.from(1),
        build: BigNumber.from(1),
      },
      pluginSetupRepo: pluginRepo.address,
    };

    psp = await createPluginSetupProcessor(signers[0], dao);

    await dao.grant(
      dao.address,
      psp.address,
      await psp.APPLY_INSTALLATION_PERMISSION_ID()
    );
    await dao.grant(
      dao.address,
      psp.address,
      await psp.APPLY_UPDATE_PERMISSION_ID()
    );
    await dao.grant(
      dao.address,
      psp.address,
      await psp.APPLY_UNINSTALLATION_PERMISSION_ID()
    );
  });

  context('Optimistic Proposal Plugin Setup', async () => {
    let plugin: OptimisticProposalPlugin;

    beforeEach(async () => {
      // Install build 1.
      const results = await installPLugin(
        psp,
        dao,
        plugin_setup,
        ethers.utils.defaultAbiCoder.encode(
          buildMetadata.pluginSetupABI.prepareInstallation,
          [123]
        )
      );

      plugin = new OptimisticProposalPlugin__factory(signers[0]).attach(
        results.preparedEvent.args.plugin
      );
    });

    it('installs & uninstalls', async () => {
      // Check implementation.
      expect(await plugin.implementation()).to.be.eq(
        await op_setup.implementation()
      );

      // Check state.
      expect(await plugin.RULE_PERMISSION_ID()).to.eq(123);

      // Uninstall build 1.
      await uninstallPLugin(
        psp,
        dao,
        plugin,
        plugin_setup,
        ethers.utils.defaultAbiCoder.encode(
          buildMetadata.pluginSetupABI.prepareUninstallation,
          []
        ),
        []
      );
    });
  });
});

export async function populateSimpleStoragePluginRepo(
  signer: SignerWithAddress,
  pluginRepoFactory: string,
  repoEnsName: string,
  setups: string[]
): Promise<PluginRepo> {
  const pluginRepoFactoryContract = new PluginRepoFactory__factory(
    signer
  ).attach(pluginRepoFactory);

  // Upload the metadata
  const metadata = {
    Release: {
      URI: `ipfs://${await uploadToIPFS(JSON.stringify(releaseMetadata))}`,

      Build1: {
        URI: `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata))}`,
      },
    },
  };

  // Create Repo for Release 1 and Build 1
  const tx = await pluginRepoFactoryContract.createPluginRepoWithFirstVersion(
    repoEnsName,
    setups[0],
    signer.address,
    toHex(metadata.Release.Build1.URI),
    toHex(metadata.Release.URI)
  );

  const eventLog = await findEventTopicLog(
    tx,
    PluginRepoRegistry__factory.createInterface(),
    'PluginRepoRegistered'
  );
  if (!eventLog) {
    throw new Error('Failed to get PluginRepoRegistered event log');
  }

  const pluginRepo = new PluginRepo__factory(signer).attach(
    eventLog.args.pluginRepo
  );

  // Create Version for Release 1 and Build 2
  await pluginRepo.createVersion(
    1,
    setups[1],
    toHex(metadata.Release.Build1.URI),
    toHex(metadata.Release.URI)
  );

  // Create Version for Release 1 and Build 3
  await pluginRepo.createVersion(
    1,
    setups[2],
    toHex(metadata.Release.Build1.URI),
    toHex(metadata.Release.URI)
  );

  return pluginRepo;
}
