export const SUBGRAPH_API_URL: {[key: number]: string} = {
  1: 'https://subgraph.satsuma-prod.com/qHR2wGfc5RLi6/aragon/osx-mainnet/api',
  5: 'https://subgraph.satsuma-prod.com/qHR2wGfc5RLi6/aragon/osx-goerli/version/v1.0.0/api',
  137: 'https://subgraph.satsuma-prod.com/qHR2wGfc5RLi6/aragon/osx-polygon/api',
  80001:
    'https://subgraph.satsuma-prod.com/qHR2wGfc5RLi6/aragon/osx-mumbai/api',
};

export const AddressZero = '0x' + '0'.repeat(40);

// DAO BOX Plugins
export const DAOBOX_PLUGIN_REPOS = {
  network: {
    goerli: {},
    mainnet: {},
    mumbai: {lensVoting: '0xD42Aa286DD6c5610FAF4D402B055f35dDb446432'},
    polygon: {lensVoting: '0x0650EE961514C90D927F302b374d52344E8C62BF'},
  },
} as const;
