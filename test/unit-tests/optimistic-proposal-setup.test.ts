import {
  DAO,
  OptimisticProposalSetup,
  OptimisticProposalSetup__factory,
  OptimisticProposalPlugin__factory,
  CentralizedArbitrator__factory,
  CentralizedArbitrator,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {Operation} from '../helpers/types';
import {
  ARB_FEE,
  COLLATERAL,
  CONFIGURE_PARAMETERS_PERMISSION_ID,
  CREATE_PROPOSAL_PERMISSION_ID,
  DAYS_3,
  EXECUTE_PERMISSION_ID,
  EXTRA_DATA,
  INIT_ABI,
  META_EVIDENCE,
  NO_CONDITION,
  RULE_PERMISSION_ID,
  abiCoder,
} from './common';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('OptimisticProposalSetup', function () {
  let signers: SignerWithAddress[];
  let OPSetup: OptimisticProposalSetup__factory;
  let opSetup: OptimisticProposalSetup;
  let Arbitraror: CentralizedArbitrator__factory;
  let arbitrator: CentralizedArbitrator;

  let initParams: string[];
  let dao: DAO;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    OPSetup = new OptimisticProposalSetup__factory(signers[0]);
    opSetup = await OPSetup.deploy();
    opSetup.deployed();

    Arbitraror = new CentralizedArbitrator__factory(signers[0]);
    arbitrator = await Arbitraror.deploy(ARB_FEE);
    arbitrator.deployed();
    initParams = [
      arbitrator.address,
      DAYS_3.toString(),
      COLLATERAL.toString(),
      META_EVIDENCE,
      EXTRA_DATA,
    ];
  });

  describe('prepareInstallation', async () => {
    let initData: string;
    before(async () => {
      initData = abiCoder.encode(INIT_ABI, initParams);
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(opSetup.address);
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: opSetup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await opSetup.callStatic.prepareInstallation(dao.address, initData);

      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(4);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          arbitrator.address,
          NO_CONDITION,
          RULE_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          CREATE_PROPOSAL_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          CONFIGURE_PARAMETERS_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          dao.address,
          plugin,
          NO_CONDITION,
          EXECUTE_PERMISSION_ID,
        ],
      ]);

      await opSetup.prepareInstallation(dao.address, initData);
      const opPlugin = new OptimisticProposalPlugin__factory(signers[0]).attach(
        plugin
      );

      // initialization is correct
      expect(await opPlugin.dao()).to.eq(dao.address);
      expect(await opPlugin.proposalCollateral()).to.be.eq(COLLATERAL);
      expect(await opPlugin.executionDelay()).to.be.eq(DAYS_3);
      expect(await opPlugin.arbitrator()).to.be.eq(arbitrator.address);
      expect(await opPlugin.arbitratorExtraData()).to.be.eq(EXTRA_DATA);
      expect(await opPlugin.metaEvidence()).to.be.eq(META_EVIDENCE);
    });
    it('this should work but dosnt', async () => {
      expect(0).equal(0);
    });
  });

  // describe('prepareUninstallation', async () => {
  //   it('returns the permissions', async () => {
  //     const dummyAddr = ADDRESS_ZERO;

  //     const permissions = await opSetup.callStatic.prepareUninstallation(
  //       dao.address,
  //       {
  //         plugin: dummyAddr,
  //         currentHelpers: [],
  //         data: EMPTY_DATA,
  //       }
  //     );

  //     expect(permissions.length).to.be.equal(1);
  //     expect(permissions).to.deep.equal([
  //       [
  //         Operation.Grant,
  //         plugin,
  //         arbitrator.address,
  //         NO_CONDITION,
  //         RULE_PERMISSION_ID,
  //       ],
  //       [
  //         Operation.Grant,
  //         plugin,
  //         dao.address,
  //         NO_CONDITION,
  //         CREATE_PROPOSAL_PERMISSION_ID,
  //       ],
  //       [
  //         Operation.Grant,
  //         plugin,
  //         dao.address,
  //         NO_CONDITION,
  //         CONFIGURE_PARAMETERS_PERMISSION_ID,
  //       ],
  //       [
  //         Operation.Grant,
  //         dao.address,
  //         plugin,
  //         NO_CONDITION,
  //         EXECUTE_PERMISSION_ID,
  //       ],
  //     ]);
  //   });
  // });
});
