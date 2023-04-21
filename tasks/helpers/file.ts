import {existsSync, readFileSync, statSync, writeFileSync} from 'fs-extra';

export interface ContractList {
  [index: string]: {[index: string]: string};
}

const deployedContractsFilePath = 'deployed_contracts.json';

export function addDeployedContract(
  networkName: string,
  contractName: string,
  contractAddr: string
) {
  let deployedContracts: ContractList;

  // Check if the file exists and is not empty
  if (
    existsSync(deployedContractsFilePath) &&
    statSync(deployedContractsFilePath).size !== 0
  ) {
    deployedContracts = JSON.parse(
      readFileSync(deployedContractsFilePath, 'utf-8')
    );
  } else {
    deployedContracts = {};
  }

  if (!deployedContracts[networkName]) {
    deployedContracts[networkName] = {};
  }

  deployedContracts[networkName][contractName] = contractAddr;

  writeFileSync(
    'deployed_contracts.json',
    JSON.stringify(deployedContracts, null, 2) + '\n'
  );
}

export const readFile = (path: string) => {
  let content;
  try {
    // Read the build metadata file
    content = readFileSync(path, 'utf8');
    // console.log('Build metadata content:', content);
  } catch (error) {
    console.error(`Error reading file from path: ${path}`, error);
  }

  return content;
};
