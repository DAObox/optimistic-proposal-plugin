import {ethers} from 'hardhat';

export const abiCoder = ethers.utils.defaultAbiCoder;
export const EMPTY_DATA = '0x';

export const RULE_PERMISSION_ID = ethers.utils.id('RULE_PERMISSION');
export const CREATE_PROPOSAL_PERMISSION_ID = ethers.utils.id(
  'CREATE_PROPOSAL_PERMISSION'
);
export const CONFIGURE_PARAMETERS_PERMISSION_ID = ethers.utils.id(
  'CONFIGURE_PARAMETERS_PERMISSION'
);
export const EXECUTE_PERMISSION_ID = ethers.utils.id('EXECUTE_PERMISSION');

export const ADDRESS_ZERO = ethers.constants.AddressZero;
export const ADDRESS_ONE = `0x${'0'.repeat(39)}1`;
export const ADDRESS_TWO = `0x${'0'.repeat(39)}2`;
export const ADDRESS_ANY = `0x${'f'.repeat(40)}`;
export const NO_CONDITION = ADDRESS_ZERO;

export const BN = ethers.BigNumber.from;

export const DAYS_3 = BN(60 * 60 * 24 * 3);
export const ARB_FEE = BN(ethers.utils.parseEther('0.069'));
export const COLLATERAL = BN(ethers.utils.parseEther('1'));
export const META_EVIDENCE = 'https://testing.com';
export const EXTRA_DATA = '0x085750';
export const INIT_ABI = [
  'address',
  'uint256',
  'uint256',
  'string',
  'bytes',
  'address[]',
];
export const INIT_PARAMS = [
  DAYS_3.toString(),
  COLLATERAL.toString(),
  META_EVIDENCE,
  EXTRA_DATA,
];
