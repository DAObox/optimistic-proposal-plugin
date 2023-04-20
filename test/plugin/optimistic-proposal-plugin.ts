import {
  DAO,
  OptimisticProposalPlugin,
  OptimisticProposalPlugin__factory,
} from '../../typechain';
import {deployWithProxy} from '../../utils/helpers';
import {deployTestDao} from '../helpers/test-dao';
import {RULE_PERMISSION_ID} from './common';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export type Input = {number: BigNumber};
export const defaultInput: Input = {
  number: BigNumber.from(123),
};

describe('Optimistic Storage Plugin', function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let op_plugin_factory: OptimisticProposalPlugin__factory;
  let op_plugin: OptimisticProposalPlugin;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    op_plugin_factory = new OptimisticProposalPlugin__factory(signers[0]);
  });

  beforeEach(async () => {
    op_plugin = await deployWithProxy<OptimisticProposalPlugin>(
      op_plugin_factory
    );
  });

  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      await op_plugin.initialize(dao.address, '', 0, 0, '', '');
      // IDAO _dao,
      //   IArbitrator _arbitrator,
      //   uint256 _executionDelay,
      //   uint256 _proposalCollateral,
      //   string calldata _metaEvidence,
      //   bytes calldata _arbitratorExtraData

      await expect(
        op_plugin.initialize(dao.address, '', 0, 0, '', '')
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });
});
