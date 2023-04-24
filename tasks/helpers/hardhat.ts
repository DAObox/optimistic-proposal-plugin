import {HardhatRuntimeEnvironment} from 'hardhat/types';

export function getNetwork(network: HardhatRuntimeEnvironment['network']) {
  return ['localhost', 'hardhat', 'coverage', 'daobox'].includes(network.name)
    ? 'mainnet'
    : network.name;
}
