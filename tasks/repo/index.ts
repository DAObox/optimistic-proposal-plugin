import {task} from 'hardhat/config';
import {
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  activeContractsList,
} from '@aragon/osx-ethers';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import Listr from 'listr';
import * as pc from 'picocolors';

import {
  addDeployedContract,
  deploy,
  findEventTopicLog,
  readFile,
} from '../helpers';
import {toHex, uploadToIPFS} from '../../utils/ipfs-upload';

import {PluginRepoFactory__factory} from '@aragon/osx-ethers';
import {Contract} from 'ethers';

const green = pc.green;
const yellow = pc.yellow;
const italic = pc.italic;
const red = pc.red;
const bold = pc.bold;

task('dao:repo:new', 'Deploy a new Repo for a Plugin')
  .addParam('setup', 'The name of the Setup Contract for the Plugin')
  .addParam('repo', `The ENS name of the Repo`)
  .addOptionalParam('metadata', 'The path to the metadata folder')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const {deployments, network, getNamedAccounts, ethers} = hre;
    const [deployer] = await hre.ethers.getSigners();
    // 1. deploy the setup contract

    const metadataPath = taskArgs.metadata ?? './contracts/metadata';
    const useNetwork = ['localhost', 'hardhat', 'coverage'].includes(
      network.name
    )
      ? 'mainnet'
      : network.name;

    const contract = taskArgs.setup;

    let buildMetadataUri: string;
    let releaseMetadataUri: string;
    let setup: Contract;
    let pluginRepoFactoryAddr =
      activeContractsList[useNetwork as keyof typeof activeContractsList]
        .PluginRepoFactory;
    const pluginRepoFactory = PluginRepoFactory__factory.connect(
      pluginRepoFactoryAddr,
      deployer
    );
    let pluginRepo: Contract;

    const tasks = new Listr([
      {
        title: 'Pin Metadata to IPFS',
        task: async () => {
          buildMetadataUri = `ipfs://${await uploadToIPFS(
            readFile(`${metadataPath}/build-metadata.json`)!
          )}`;

          releaseMetadataUri = `ipfs://${await uploadToIPFS(
            readFile(`${metadataPath}/release-metadata.json`)!
          )}`;
        },
      },
      {
        title: `Deploy ${bold(green(contract))} Contract`,
        task: async () => {
          setup = await deploy({name: contract, hre, log: true});
        },
      },
      {
        title: `Deploy repo at ${red(bold(taskArgs.repo))}${green(
          italic('.plugin.dao.eth')
        )}`,
        task: async () => {
          const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
            taskArgs.repo,
            setup.address,
            deployer.address,
            toHex(releaseMetadataUri),
            toHex(buildMetadataUri)
          );

          const eventLog = await findEventTopicLog(
            tx,
            PluginRepoRegistry__factory.createInterface(),
            'PluginRepoRegistered'
          );

          if (!eventLog) {
            throw new Error('Failed to get PluginRepoRegistered event log');
          }

          pluginRepo = PluginRepo__factory.connect(
            eventLog.args.pluginRepo,
            deployer
          );

          addDeployedContract(network.name, 'PluginRepo', pluginRepo.address);
          addDeployedContract(network.name, taskArgs.setup, setup.address);
        },
      },
    ]);

    await tasks.run().then(() => {
      console.log(
        `\n  🎉 ${red(bold(taskArgs.repo))}${green(
          italic('.plugin.dao.eth')
        )} deployed at: ${yellow(pluginRepo.address)} \n`
      );
    });
  });

task(
  'dao:repo:bump:minor',
  'bump the minor version of a Repo with a new setup contract'
)
  .addParam('setup', 'The name of the Setup Contract for the Plugin')
  .addParam('build', 'The path to the build metadata')
  .addParam('release', 'The path to the release metadata')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});

task(
  'dao:repo:bump:major',
  'bump the major version of a Repo with a new setup contract'
)
  .addParam('setup', 'The name of the Setup Contract for the Plugin')
  .addParam('build', 'The path to the build metadata')
  .addParam('release', 'The path to the release metadata')
  .setAction(async function (taskArgs, hre: HardhatRuntimeEnvironment) {});
