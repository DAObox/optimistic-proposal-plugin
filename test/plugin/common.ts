import {ethers} from 'hardhat';

export const abiCoder = ethers.utils.defaultAbiCoder;
export const EMPTY_DATA = '0x';

// Get a list of all permissions in the contract
export const RULE_PERMISSION_ID = ethers.utils.id('RULE_PERMISSION');
export const CREATE_PROPOSAL_PERMISSION_ID = ethers.utils.id(
  'CREATE_PROPOSAL_PERMISSION'
);
export const CONFIGURE_PARAMETERS_PERMISSION_ID = ethers.utils.id(
  'CONFIGURE_PARAMETERS_PERMISSION'
);

export const ADDRESS_ZERO = ethers.constants.AddressZero;
export const ADDRESS_ONE = `0x${'0'.repeat(39)}1`;
export const ADDRESS_TWO = `0x${'0'.repeat(39)}2`;
export const NO_CONDITION = ADDRESS_ZERO;
