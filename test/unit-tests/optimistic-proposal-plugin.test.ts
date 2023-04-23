import {Provider} from '@ethersproject/providers';
import {expect} from 'chai';
import hre, {ethers} from 'hardhat';

import {
  DAO,
  OptimisticProposalPlugin,
  OptimisticProposalPlugin__factory,
  CentralizedArbitrator,
  CentralizedArbitrator__factory,
  IDAO,
  Target__factory,
  Target,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {
  ARB_FEE,
  COLLATERAL,
  CONFIGURE_PARAMETERS_PERMISSION_ID,
  CREATE_PROPOSAL_PERMISSION_ID,
  DAYS_3,
  EXECUTE_PERMISSION_ID,
  EXTRA_DATA,
  META_EVIDENCE,
  abiCoder,
} from './common';
import {deployWithProxy, findEvent} from '../../utils/helpers';
import {
  EvidenceEvent,
  ProposalCanceledEvent,
  ProposalCreatedEvent,
  ProposalDisputedEvent,
  ProposalExecutedEvent,
} from '../../typechain/contracts/OptimisticProposalPlugin';
import {DisputeStatus, ProposalStatus} from '../helpers/types';
import {plugin} from '../../typechain/@aragon/osx/core';
import exp from 'constants';
import {BigNumber} from 'ethers';

describe('OptimisticProposalPlugin', () => {
  let signers: SignerWithAddress[];
  let provider: Provider;
  let deployer: SignerWithAddress;
  let proposer: SignerWithAddress;
  let challenger: SignerWithAddress;
  let admin: SignerWithAddress;
  let rando: SignerWithAddress;
  let dao: DAO;
  let OPPluginFactory: OptimisticProposalPlugin__factory;
  let opPlugin: OptimisticProposalPlugin;
  let Arbitraror: CentralizedArbitrator__factory;
  let arbitrator: CentralizedArbitrator;
  let TargetFactory: Target__factory;
  let target: Target;

  before(async () => {
    signers = await ethers.getSigners();
    provider = ethers.provider;
    deployer = signers[0];
    proposer = signers[1];
    challenger = signers[2];
    admin = signers[3];
    rando = signers[4];

    dao = await deployTestDao(deployer);

    Arbitraror = new CentralizedArbitrator__factory(deployer);
    arbitrator = await Arbitraror.deploy(ARB_FEE);
    arbitrator.deployed();
    OPPluginFactory = new OptimisticProposalPlugin__factory(deployer);

    TargetFactory = new Target__factory(deployer);
    target = await TargetFactory.deploy();
    target.deployed();
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
    beforeEach(async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        '0x123456'
      );
    });
    it('should successfully update executionDelay', async () => {
      // Test successful parameter update with valid values
      const newExecutionDelay = 69420;
      // let permission;
      // permission = await dao.hasPermission(
      //   admin.address,
      //   opPlugin.address,
      //   CONFIGURE_PARAMETERS_PERMISSION_ID,
      //   EMPTY_DATA
      // );
      // console.log('before permission ', permission);

      // Grant CONFIGURE_PARAMETERS_PERMISSION_ID to admin
      await dao.grant(
        opPlugin.address,
        admin.address,
        CONFIGURE_PARAMETERS_PERMISSION_ID
      );

      // permission = await dao.hasPermission(
      //   admin.address,
      //   opPlugin.address,
      //   CONFIGURE_PARAMETERS_PERMISSION_ID,
      //   EMPTY_DATA
      // );
      // console.log('after permission', permission);

      // Connect the contract with the admin signer
      const adminOpPlugin = opPlugin.connect(admin);
      // console.log('dao:           ', dao.address);
      // console.log('opPlugin:      ', adminOpPlugin.address);
      // console.log('admin:         ', admin.address);
      // console.log('permission:    ', CONFIGURE_PARAMETERS_PERMISSION_ID);

      // Update executionDelay using the admin signer
      const what = ethers.utils.formatBytes32String('executionDelay');
      const value = ethers.utils.defaultAbiCoder.encode(
        ['uint256'],
        [newExecutionDelay]
      );
      // await adminOpPlugin.callStatic.updateState(what, value);
      await adminOpPlugin.updateState(what, value, {gasLimit: 1000000});

      expect(await opPlugin.executionDelay()).to.equal(newExecutionDelay);
    });

    it('should successfully update arbitrator', async () => {
      const newArbitrator = await Arbitraror.deploy(ARB_FEE);
      newArbitrator.deployed();

      await dao.grant(
        opPlugin.address,
        admin.address,
        CONFIGURE_PARAMETERS_PERMISSION_ID
      );
      const adminOpPlugin = opPlugin.connect(admin);

      const what = ethers.utils.formatBytes32String('arbitrator');
      const value = ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [newArbitrator.address]
      );

      await adminOpPlugin.updateState(what, value);

      expect(await opPlugin.arbitrator()).to.equal(newArbitrator.address);
    });

    it('should successfully update proposalCollateral', async () => {
      const newProposalCollateral = 187_000_000;

      await dao.grant(
        opPlugin.address,
        admin.address,
        CONFIGURE_PARAMETERS_PERMISSION_ID
      );
      const adminOpPlugin = opPlugin.connect(admin);

      const what = ethers.utils.formatBytes32String('proposalCollateral');
      const value = ethers.utils.defaultAbiCoder.encode(
        ['uint256'],
        [newProposalCollateral]
      );

      await adminOpPlugin.updateState(what, value);

      expect(await opPlugin.proposalCollateral()).to.equal(
        newProposalCollateral
      );
    });

    it('should successfully update metaEvidence', async () => {
      const newMetaEvidence = 'ipfs://NEW_META_EVIDENCE';

      await dao.grant(
        opPlugin.address,
        admin.address,
        CONFIGURE_PARAMETERS_PERMISSION_ID
      );
      const adminOpPlugin = opPlugin.connect(admin);

      const what = ethers.utils.formatBytes32String('metaEvidence');
      const value = ethers.utils.defaultAbiCoder.encode(
        ['string'],
        [newMetaEvidence]
      );

      await adminOpPlugin.updateState(what, value);

      expect(await opPlugin.metaEvidence()).to.equal(newMetaEvidence);
    });

    it('should successfully update arbitratorExtraData', async () => {
      const newExtraData = '0x654321';

      await dao.grant(
        opPlugin.address,
        admin.address,
        CONFIGURE_PARAMETERS_PERMISSION_ID
      );
      const adminOpPlugin = opPlugin.connect(admin);

      const what = ethers.utils.formatBytes32String('arbitratorExtraData');

      await adminOpPlugin.updateState(what, newExtraData);

      expect(await opPlugin.arbitratorExtraData()).to.equal(newExtraData);
    });

    it('should revert when called without CONFIGURE_PARAMETERS_PERMISSION_ID', async () => {
      // Test revert when called without CONFIGURE_PARAMETERS_PERMISSION_ID
      const newProposalCollateral = 187_000_000;

      const adminOpPlugin = opPlugin.connect(admin);

      const what = ethers.utils.formatBytes32String('proposalCollateral');
      const value = ethers.utils.defaultAbiCoder.encode(
        ['uint256'],
        [newProposalCollateral]
      );

      await expect(adminOpPlugin.updateState(what, value))
        .to.be.revertedWithCustomError(adminOpPlugin, 'DaoUnauthorized')
        .withArgs(
          dao.address,
          opPlugin.address,
          admin.address,
          CONFIGURE_PARAMETERS_PERMISSION_ID
        );
    });

    it('should revert when called with invalid parameter name', async () => {
      // Test revert when called with invalid parameter name
      const newMetaEvidence = 'ipfs://NEW_META_EVIDENCE';

      await dao.grant(
        opPlugin.address,
        admin.address,
        CONFIGURE_PARAMETERS_PERMISSION_ID
      );
      const adminOpPlugin = opPlugin.connect(admin);

      const what = ethers.utils.formatBytes32String('WTF');
      const value = ethers.utils.defaultAbiCoder.encode(
        ['string'],
        [newMetaEvidence]
      );

      await expect(adminOpPlugin.updateState(what, value))
        .to.be.revertedWithCustomError(adminOpPlugin, 'InvalidParameter')
        .withArgs(what);
    });
  });

  describe('createProposal', () => {
    beforeEach(async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        '0x123456'
      );
    });

    it('should successfully create a proposal with valid values', async () => {
      // Test successful proposal creation with valid values

      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      // Create the action object with target contract's address, value, and data
      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      const collateral = await opPlugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const metadata = '0x123456';
      // Create the proposal
      const createProposalTx = await opPlugin.connect(proposer).createProposal(
        metadata,
        [action],
        0, // _allowFailureMap
        {value: collateral.add(fee)}
      );

      // get the block timestamp
      createProposalTx.timestamp;

      const timestamp = (await provider.getBlock(createProposalTx.blockNumber!))
        ?.timestamp as number;

      // Verify the proposal creation event is emitted
      await expect(createProposalTx)
        .to.emit(opPlugin, 'CollateralDeposited')
        .withArgs(proposer.address, collateral.add(fee));

      const proposalEvent = (await findEvent<ProposalCreatedEvent>(
        createProposalTx,
        'ProposalCreated'
      )) as ProposalCreatedEvent;
      expect(proposalEvent.args.proposalId).to.equal(1);
      expect(proposalEvent.args.creator).to.equal(proposer.address);
      expect(proposalEvent.args.executionFromTime).to.equal(
        DAYS_3.add(timestamp)
      );
      expect(proposalEvent.args.proposerCollateral).to.equal(collateral);
      expect(proposalEvent.args.metadata).to.equal(metadata);
      expect(proposalEvent.args.actions[0].to).to.equal(action.to);
      expect(proposalEvent.args.actions[0].value).to.equal(action.value);
      expect(proposalEvent.args.actions[0].data).to.equal(action.data);
      expect(proposalEvent.args.allowFailureMap).to.equal(0);

      // Verify the proposal state in the contract
      const proposal = await opPlugin.getProposal(1);
      expect(proposal.status).to.equal(ProposalStatus.Active);
      expect(proposal.metadata).to.equal(metadata);
      expect(proposal.actions[0].to).to.equal(action.to);
      expect(proposal.actions[0].data).to.equal(action.data);
      expect(proposal.actions[0].value).to.equal(action.value);
    });

    it('should revert when called without CREATE_PROPOSAL_PERMISSION_ID', async () => {
      // Test revert when called without CREATE_PROPOSAL_PERMISSION_ID

      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      const plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      // console.log({
      //   dao: dao.address,
      //   plugin: plugin.address,
      //   proposer: proposer.address,
      //   CREATE_PROPOSAL_PERMISSION_ID,
      // });

      await expect(plugin.createProposal(metadata, [action], 0, {value}))
        .to.be.revertedWithCustomError(plugin, 'DaoUnauthorized')
        .withArgs(
          dao.address,
          plugin.address,
          proposer.address,
          CREATE_PROPOSAL_PERMISSION_ID
        );
    });

    it('should revert when _actions is empty', async () => {
      // Test revert when _actions is empty
      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      const plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      await expect(
        plugin.createProposal(metadata, [], 0, {value})
      ).to.be.revertedWithCustomError(plugin, 'NoActions');
    });

    it('should revert when not enough collateral is provided', async () => {
      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);
      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      const plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      await expect(plugin.createProposal(metadata, [action], 0, {value: 0}))
        .to.be.revertedWithCustomError(plugin, 'NotEnoughCollateral')
        .withArgs(value, 0);
    });
  });

  describe('_executeArbitrableProposal', () => {
    beforeEach(async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        '0x123456'
      );

      await dao.grant(dao.address, opPlugin.address, EXECUTE_PERMISSION_ID);
    });

    it('should successfully execute an active proposal', async () => {
      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      // Create the action object with target contract's address, value, and data
      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      const plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const metadata = '0x123456';
      // Create the proposal
      const createProposalTx = await plugin.createProposal(
        metadata,
        [action],
        0, // _allowFailureMap
        {value: collateral.add(fee)}
      );

      // get the block timestamp
      createProposalTx.timestamp;

      const timestamp = (await provider.getBlock(createProposalTx.blockNumber!))
        ?.timestamp as number;

      // console.log({timestamp});

      // mine 3 days worth blocks with an interval of 1 minute
      await hre.network.provider.send('hardhat_mine', ['0x3F480', '0x3c']);

      // console.log({Efromtime: proposal.executionFromTime.toString()});

      // Execute the proposal

      const res = await plugin.callStatic.executeProposal(1);
      const decodedMessage = abiCoder.decode(['string'], res.execResults[0]);

      expect(decodedMessage[0]).to.equal('Test Works!');
      expect(res.failureMap).to.equal(ethers.BigNumber.from(0));

      let message = await target.message();

      const executeProposalTx = await plugin.executeProposal(1);
      const proposal = await opPlugin.getProposal(1);
      expect(proposal.status).to.equal(ProposalStatus.Executed);

      const proposalEvent = (await findEvent<ProposalExecutedEvent>(
        executeProposalTx,
        'ProposalCreated'
      )) as ProposalExecutedEvent;

      // TODO: Fix this
      // expect(proposalEvent.args.proposalId).to.equal(1);

      message = await target.message();
      expect(message).to.equal('Test Works!');
    });

    it('should revert when trying to execute before executionFromTime', async () => {
      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      const plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      await plugin.createProposal(metadata, [action], 0, {value});

      const proposal = await opPlugin.getProposal(1);
      const currentTime = (await provider.getBlock('latest'))?.timestamp;
      const executeFromTime = proposal.executionFromTime;

      await expect(plugin.executeProposal(1))
        .to.be.revertedWithCustomError(plugin, 'ProposalNotExecutable')
        .withArgs(currentTime + 1, executeFromTime, ProposalStatus.Active);
    });
  });

  describe('cancelProposal', () => {
    beforeEach(async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        '0x123456'
      );

      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );
    });
    it('should successfully cancel a proposal by proposer', async () => {
      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      const plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      await plugin.createProposal(metadata, [action], 0, {value});
      const cancelTx = await plugin.cancelProposal(1);

      const proposalEvent = (await findEvent<ProposalCanceledEvent>(
        cancelTx,
        'ProposalCanceled'
      )) as ProposalCanceledEvent;

      expect(proposalEvent.args.proposalId).to.equal(1);
    });

    it('should revert when caller is not proposer', async () => {
      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      let plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      plugin.createProposal(metadata, [action], 0, {value});

      plugin = opPlugin.connect(rando);

      await expect(plugin.cancelProposal(1))
        .to.be.revertedWithCustomError(plugin, 'NotProposer')
        .withArgs(proposer.address, rando.address);
    });

    it('should revert when status is not Active', async () => {
      const data = target.interface.encodeFunctionData('setMessage', [
        'Test Works!',
      ]);

      await dao.grant(dao.address, opPlugin.address, EXECUTE_PERMISSION_ID);

      const action: IDAO.ActionStruct = {
        to: target.address,
        value: 0,
        data: data,
      };

      let plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);
      const metadata = '0x123456';

      await plugin.createProposal(metadata, [action], 0, {value});
      await hre.network.provider.send('hardhat_mine', ['0x3F480', '0x3c']);
      await plugin.executeProposal(1);

      await expect(plugin.cancelProposal(1))
        .to.be.revertedWithCustomError(plugin, 'ProposalNotActive')
        .withArgs(ProposalStatus.Executed);
    });
  });

  describe('challengeProposal', () => {
    beforeEach(async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        '0x123456'
      );

      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      let plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);

      await plugin.createProposal(
        '0x123456',
        [
          {
            to: target.address,
            value: 0,
            data: target.interface.encodeFunctionData('setMessage', [
              'Test Works!',
            ]),
          },
        ],
        0,
        {value}
      );
    });
    it('should successfully challenge a proposal with valid values', async () => {
      // Test successful proposal challenge with valid values
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const plugin = opPlugin.connect(challenger);

      const disputeTx = await plugin.challengeProposal(1, {value: fee});
      const proposalEvent = (await findEvent<ProposalDisputedEvent>(
        disputeTx,
        'ProposalDisputed'
      )) as ProposalDisputedEvent;

      const proposal = await opPlugin.getProposal(1);

      expect(proposalEvent.args.proposalId).to.equal(1);
      expect(proposalEvent.args.challenger).to.equal(challenger.address);
      expect(proposal.status).to.equal(ProposalStatus.Paused);
      expect(proposal.disputeStatus).to.equal(DisputeStatus.DisputeCreated);
      expect(proposal.disputeId).to.equal(proposalEvent.args.disputeId);
      expect(proposal.challenger).to.equal(challenger.address);
      expect(proposal.proposerPaidFees).to.equal(fee);
      expect(proposal.pausedAtTime).to.equal(
        (await provider.getBlock(disputeTx.blockHash!)).timestamp
      );
    });

    it('should revert when dispute has already been created', async () => {
      // Test revert when dispute has already been created
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const plugin = opPlugin.connect(challenger);

      await plugin.challengeProposal(1, {value: fee});
      await expect(plugin.challengeProposal(1, {value: fee}))
        .to.revertedWithCustomError(plugin, 'ProposalNotActive')
        .withArgs(ProposalStatus.Paused);
    });

    it('should revert when not enough arbitration fee is provided', async () => {
      // Test revert when not enough arbitration fee is provided
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const plugin = opPlugin.connect(challenger);

      await expect(plugin.challengeProposal(1, {value: 0}))
        .to.revertedWithCustomError(plugin, 'InsufficientArbitrationFee')
        .withArgs(fee, 0);
    });
  });

  describe('_submitEvidence', () => {
    beforeEach(async () => {
      await opPlugin.initialize(
        dao.address,
        arbitrator.address,
        DAYS_3,
        COLLATERAL,
        META_EVIDENCE,
        '0x123456'
      );

      await dao.grant(
        opPlugin.address,
        proposer.address,
        CREATE_PROPOSAL_PERMISSION_ID
      );

      let plugin = opPlugin.connect(proposer);

      const collateral = await plugin.proposalCollateral();
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      const value = collateral.add(fee);

      await plugin.createProposal(
        '0x123456',
        [
          {
            to: target.address,
            value: 0,
            data: target.interface.encodeFunctionData('setMessage', [
              'Test Works!',
            ]),
          },
        ],
        0,
        {value}
      );
    });
    it('should successfully submit evidence by proposer and challenger', async () => {
      // Test successful evidence submission by proposer or challenger
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      let plugin = opPlugin.connect(challenger);
      const challangerEvidence = 'https://its.a.trap.com';
      const proposerEvidence = 'https://snapshot.com/vote/1234';

      await plugin.challengeProposal(1, {value: fee});

      const proposal = await opPlugin.getProposal(1);
      // console.log(proposal);

      const challangerTx = await plugin.submitEvidence(
        proposal.disputeId,
        challangerEvidence
      );
      const chalangerEvidenceEvent = (await findEvent<EvidenceEvent>(
        challangerTx,
        'Evidence'
      )) as EvidenceEvent;

      expect(chalangerEvidenceEvent.args._arbitrator).to.equal(
        arbitrator.address
      );
      expect(chalangerEvidenceEvent.args._evidenceGroupID).to.equal(
        proposal.disputeId
      );
      expect(chalangerEvidenceEvent.args._party).to.equal(challenger.address);
      expect(chalangerEvidenceEvent.args._evidence).to.equal(
        challangerEvidence
      );

      plugin = opPlugin.connect(proposer);
      const proposerTx = await plugin.submitEvidence(
        proposal.disputeId,
        proposerEvidence
      );
      const proposerEvidenceEvent = (await findEvent<EvidenceEvent>(
        proposerTx,
        'Evidence'
      )) as EvidenceEvent;

      expect(proposerEvidenceEvent.args._arbitrator).to.equal(
        arbitrator.address
      );
      expect(proposerEvidenceEvent.args._evidenceGroupID).to.equal(
        proposal.disputeId
      );
      expect(proposerEvidenceEvent.args._party).to.equal(proposer.address);
      expect(proposerEvidenceEvent.args._evidence).to.equal(proposerEvidence);
    });

    it('should revert when caller is not proposer or challenger', async () => {
      // Test revert when caller is not proposer or challenger
      const fee = await arbitrator.arbitrationCost(EXTRA_DATA);
      let plugin = opPlugin.connect(challenger);
      const challangerEvidence = 'https://its.a.trap.com';
      await plugin.challengeProposal(1, {value: fee});

      const proposal = await opPlugin.getProposal(1);
      const randoPlugin = opPlugin.connect(rando);

      await expect(
        randoPlugin.submitEvidence(proposal.disputeId, challangerEvidence)
      )
        .to.revertedWithCustomError(randoPlugin, 'NotProposerOrChallenger')
        .withArgs(proposer.address, challenger.address, rando.address);
    });
  });

  // describe('_rule', () => {
  //   it('should successfully rule with valid values', async () => {
  //     // Test successful ruling with valid values
  //     expect(2 + 2).to.equal(5);
  //   });

  //   it('should revert when proposal is not paused', async () => {
  //     // Test revert when proposal is not paused
  //     expect(2 + 2).to.equal(5);
  //   });

  //   it('should revert when invalid ruling value is provided', async () => {
  //     // Test revert when invalid ruling value is provided
  //     expect(2 + 2).to.equal(5);
  //   });
  // });

  // describe('isMember', () => {
  //   it('should correctly check for member with CREATE_PROPOSAL_PERMISSION_ID', async () => {
  //     // Test successful check of member with CREATE_PROPOSAL_PERMISSION_ID
  //     expect(2 + 2).to.equal(5);
  //   });

  //   it('should correctly check for non-member with CREATE_PROPOSAL_PERMISSION_ID', async () => {
  //     // Test non-member check with CREATE_PROPOSAL_PERMISSION_ID
  //     expect(2 + 2).to.equal(5);
  //   });
  // });
});
