import {Web3Storage, File} from 'web3.storage';
import {config as dotenvConfig} from 'dotenv';
dotenvConfig();

export async function uploadToIPFS(json) {
  // Create a Web3Storage client instance
  const client = new Web3Storage({
    token: process.env.WEB_3_STORAGE_KEY!,
  });

  // Convert the JSON object to a string and then to a Buffer
  const jsonString = JSON.stringify(json);
  const jsonBuffer = Buffer.from(jsonString);

  // Create a File object with the JSON buffer
  const file = new File([jsonBuffer], 'data.json');

  // Store the File object on web3.storage
  const cid = await client.put([file]);

  // Return the IPFS URI to the content
  return `ipfs://${cid}/data.json`;
}
