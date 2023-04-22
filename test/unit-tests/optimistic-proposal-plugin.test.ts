import {expect} from 'chai';
import {ethers} from 'hardhat';
import {
  DAO,
  OptimisticProposalPlugin,
  OptimisticProposalPlugin__factory,
  CentralizedArbitrator,
  CentralizedArbitrator__factory,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {
  ADDRESS_ZERO,
  ARB_FEE,
  COLLATERAL,
  CONFIGURE_PARAMETERS_PERMISSION_ID,
  CREATE_PROPOSAL_PERMISSION_ID,
  DAYS_3,
  EMPTY_DATA,
  EXECUTE_PERMISSION_ID,
  EXTRA_DATA,
  INIT_ABI,
  INIT_PARAMS,
  META_EVIDENCE,
  NO_CONDITION,
  RULE_PERMISSION_ID,
  abiCoder,
} from './common';
import {deployWithProxy} from '../../utils/helpers';

describe('OptimisticProposalPlugin', () => {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let OPPluginFactory: OptimisticProposalPlugin__factory;
  let opPlugin: OptimisticProposalPlugin;
  let Arbitraror: CentralizedArbitrator__factory;
  let arbitrator: CentralizedArbitrator;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    Arbitraror = new CentralizedArbitrator__factory(signers[0]);
    arbitrator = await Arbitraror.deploy(ARB_FEE);
    arbitrator.deployed();
    OPPluginFactory = new OptimisticProposalPlugin__factory(signers[0]);
  });

  beforeEach(async () => {
    opPlugin = await deployWithProxy<OptimisticProposalPlugin>(OPPluginFactory);
  });

  describe('initialize', () => {
    it('should successfully initialize', async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        EXTRA_DATA
      );
      expect(await opPlugin.dao()).to.equal(dao.address);
      expect(await opPlugin.arbitrator()).to.equal(arbitrator.address);
      expect(await opPlugin.executionDelay()).to.equal(DAYS_3);
      expect(await opPlugin.proposalCollateral()).to.equal(COLLATERAL);
      expect(await opPlugin.metaEvidence()).to.equal(META_EVIDENCE);
      expect(await opPlugin.arbitratorExtraData()).to.equal(EXTRA_DATA);
    });

    it('should revert when called more than once', async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        EXTRA_DATA
      );
      await expect(
        opPlugin.initialize(
          dao.address,
          arbitrator.address,
          DAYS_3,
          COLLATERAL,
          META_EVIDENCE,
          EXTRA_DATA
        )
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });

  describe('updateState', () => {
    it('should successfully update parameters with valid values', async () => {
      // Test successful parameter update with valid values
      expect(2 + 2).to.equal(5);
    });

    it('should revert when called without CONFIGURE_PARAMETERS_PERMISSION_ID', async () => {
      // Test revert when called without CONFIGURE_PARAMETERS_PERMISSION_ID
      expect(2 + 2).to.equal(5);
    });

    it('should revert when called with invalid parameter name', async () => {
      // Test revert when called with invalid parameter name
      expect(2 + 2).to.equal(5);
    });
  });

  describe('createProposal', () => {
    it('should successfully create a proposal with valid values', async () => {
      // Test successful proposal creation with valid values
      expect(2 + 2).to.equal(5);
    });

    it('should revert when called without CREATE_PROPOSAL_PERMISSION_ID', async () => {
      // Test revert when called without CREATE_PROPOSAL_PERMISSION_ID
      expect(2 + 2).to.equal(5);
    });

    it('should revert when _actions is empty', async () => {
      // Test revert when _actions is empty
      expect(2 + 2).to.equal(5);
    });

    it('should revert when not enough collateral is provided', async () => {
      // Test revert when not enough collateral is provided
      expect(2 + 2).to.equal(5);
    });
  });

  describe('_executeArbitrableProposal', () => {
    it('should successfully execute an active proposal', async () => {
      // Test successful execution of an active proposal
      expect(2 + 2).to.equal(5);
    });

    it('should revert when proposal is not active', async () => {
      // Test revert when proposal is not active
      expect(2 + 2).to.equal(5);
    });

    it('should revert when trying to execute before executionFromTime', async () => {
      // Test revert when trying to execute before executionFromTime
      expect(2 + 2).to.equal(5);
    });
  });

  describe('cancelProposal', () => {
    it('should successfully cancel a proposal by proposer', async () => {
      // Test successful proposal cancellation by proposer
      expect(2 + 2).to.equal(5);
    });

    it('should revert when caller is not proposer', async () => {
      // Test revert when caller is not proposer
      expect(2 + 2).to.equal(5);
    });

    it('should revert when status is not Active or RuledAllowed', async () => {
      // Test revert when status is not Active or RuledAllowed
      expect(2 + 2).to.equal(5);
    });
  });

  describe('challengeProposal', () => {
    it('should successfully challenge a proposal with valid values', async () => {
      // Test successful proposal challenge with valid values
      expect(2 + 2).to.equal(5);
    });

    it('should revert when proposal is not active', async () => {
      // Test revert when proposal is not active
      expect(2 + 2).to.equal(5);
    });

    it('should revert when not enough arbitration fee is provided', async () => {
      // Test revert when not enough arbitration fee is provided
      expect(2 + 2).to.equal(5);
    });

    it('should revert when dispute has already been created', async () => {
      // Test revert when dispute has already been created
      expect(2 + 2).to.equal(5);
    });
  });

  describe('_submitEvidence', () => {
    it('should successfully submit evidence by proposer or challenger', async () => {
      // Test successful evidence submission by proposer or challenger
      expect(2 + 2).to.equal(5);
    });

    it('should revert when caller is not proposer or challenger', async () => {
      // Test revert when caller is not proposer or challenger
      expect(2 + 2).to.equal(5);
    });

    it('should revert when dispute status is NoDispute or Resolved', async () => {
      // Test revert when dispute status is NoDispute or Resolved
      expect(2 + 2).to.equal(5);
    });
  });

  describe('_rule', () => {
    it('should successfully rule with valid values', async () => {
      // Test successful ruling with valid values
      expect(2 + 2).to.equal(5);
    });

    it('should revert when proposal is not paused', async () => {
      // Test revert when proposal is not paused
      expect(2 + 2).to.equal(5);
    });

    it('should revert when invalid ruling value is provided', async () => {
      // Test revert when invalid ruling value is provided
      expect(2 + 2).to.equal(5);
    });
  });

  describe('isMember', () => {
    it('should correctly check for member with CREATE_PROPOSAL_PERMISSION_ID', async () => {
      // Test successful check of member with CREATE_PROPOSAL_PERMISSION_ID
      expect(2 + 2).to.equal(5);
    });

    it('should correctly check for non-member with CREATE_PROPOSAL_PERMISSION_ID', async () => {
      // Test non-member check with CREATE_PROPOSAL_PERMISSION_ID
      expect(2 + 2).to.equal(5);
    });
  });

  describe('supportsInterface', () => {
    it('should correctly support DISPUTABLE_PLUGIN_INTERFACE_ID', async () => {
      // Test correct support for DISPUTABLE_PLUGIN_INTERFACE_ID
      expect(2 + 2).to.equal(5);
    });

    it('should correctly support IMembership interfaceId', async () => {
      // Test correct support for IMembership interfaceId
      expect(2 + 2).to.equal(5);
    });

    it('should correctly support inherited interfaces (PluginUUPSUpgradeable, Proposals)', async () => {
      // Test correct support for inherited interfaces (PluginUUPSUpgradeable, Proposals)
      expect(2 + 2).to.equal(5);
    });
  });
});
