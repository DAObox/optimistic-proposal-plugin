import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import Listr from 'listr';
import * as pc from 'picocolors';

import {deploy, readFile} from '../helpers';
import {uploadToIPFS} from '../../utils/ipfs-upload';

const green = pc.green;
const yellow = pc.yellow;
const italic = pc.italic;
const red = pc.red;
const bold = pc.bold;

task('dao:repo:new', 'Deploy a new Repo for a Plugin')
  .addParam('setup', 'The name of the Setup Contract for the Plugin')
  .addParam('repo', `The ENS name of the Repo`)
  .addParam('metadata', 'The path to the metadata folder')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const {deployments, network, getNamedAccounts, ethers} = hre;

    // 1. deploy the setup contract

    const metadataPath = taskArgs.metadata;
    const contract = taskArgs.setup;

    let buildMetadataUri;
    let releaseMetadataUri;
    let setup;

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
        title: `Deploy ${bold(contract)} Contract`,
        task: async () => {
          setup = await deploy({name: contract, hre, log: true});
        },
      },
    ]);

    await tasks.run();
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
