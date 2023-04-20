import buildMetadata from '../../contracts/build-metadata.json';
import {
  DAO,
  OptimisticProposalSetup,
  OptimisticProposalSetup__factory,
  OptimisticProposalPlugin__factory,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {Operation} from '../helpers/types';
import {
  ADDRESS_ZERO,
  EMPTY_DATA,
  NO_CONDITION,
  RULE_PERMISSION_ID,
  abiCoder,
} from './common';
import {defaultInput} from './optimistic-proposal-plugin';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('Optimistic Proposal Setup', function () {
  let signers: SignerWithAddress[];
  let op_setup: OptimisticProposalSetup;
  let op_setup_factory: OptimisticProposalSetup__factory;
  let dao: DAO;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    op_setup_factory = new OptimisticProposalSetup__factory(signers[0]);
    op_setup = await op_setup_factory.deploy();
  });

  describe('prepareInstallation', async () => {
    let initData: string;

    before(async () => {
      initData = abiCoder.encode(
        buildMetadata.pluginSetupABI.prepareInstallation,
        [defaultInput.number]
      );
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(op_setup.address);
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: op_setup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await op_setup.callStatic.prepareInstallation(dao.address, initData);

      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          RULE_PERMISSION_ID,
        ],
      ]);

      await op_setup.prepareInstallation(dao.address, initData);
      const op_setup_factory = new OptimisticProposalPlugin__factory(
        signers[0]
      ).attach(plugin);

      // initialization is correct
      expect(await op_setup_factory.dao()).to.eq(dao.address);
    });
  });

  describe('prepareUninstallation', async () => {
    it('returns the permissions', async () => {
      const dummyAddr = ADDRESS_ZERO;

      const permissions = await op_setup.callStatic.prepareUninstallation(
        dao.address,
        {
          plugin: dummyAddr,
          currentHelpers: [],
          data: EMPTY_DATA,
        }
      );

      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          dummyAddr,
          dao.address,
          NO_CONDITION,
          RULE_PERMISSION_ID,
        ],
      ]);
    });
  });
});
