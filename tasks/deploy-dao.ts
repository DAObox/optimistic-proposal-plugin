import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';

// import {uploadToIPFS} from '../utils/ipfs-upload';
// import {encodePluginInstallItem} from '../utils/encodePluginInstall';

task(
  'deploy-dao',
  'deploys a new DAO',
  async (_args: any, hre: HardhatRuntimeEnvironment) => {
    const signer = (await hre.ethers.getSigners())[0];
    console.log('Signer address:', signer.address);

    // const metadata = {
    //   name: 'My DAO',
    //   description: 'This is a description',
    //   avatar: 'image-url',
    //   links: [
    //     {
    //       name: 'Web site',
    //       url: 'https://...',
    //     },
    //   ],
    // };

    // // Pin metadata to IPFS
    // // const metadataUri = await client.methods.pinMetadata(metadata);
    // const metadataUri = await uploadToIPFS(JSON.stringify(metadata));
    // console.log(metadataUri);
    // const adminInstallItem = encodePluginInstallItem({
    //   types: ['address'],
    //   parameters: [signer.address],
    //   repoAddress: '0x633845bB511DE83EA31b8717614d88fa7b569694',
    // });

    // const createDaoParams = {
    //   name: 'Test Admin DAO',
    //   ensSubdomain: 'test-admin-dao-23984092834098230',
    //   plugins: [adminInstallItem],
    //   metadataUri,
    // };
  }
);
