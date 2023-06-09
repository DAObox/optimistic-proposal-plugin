# `Optimistic Proposals` Plugin

[![Github Actions][gha-badge]][gha] [![Hardhat][hardhat-badge]][hardhat] [![License: AGPL-3.0-or-later][license-badge]][license]

[gha]: https://github.com/aragon/simple-storage-example-plugin/actions
[gha-badge]: https://github.com/aragon/simple-storage-example-plugin/actions/workflows/ci.yml/badge.svg
[hardhat]: https://hardhat.org/
[hardhat-badge]: https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg
[license]: https://spdx.org/licenses/AGPL-3.0-or-later.html
[license-badge]: https://img.shields.io/badge/License-AGPL--3.0--or--later-blue

An Aragon OSx plugin using

- [Hardhat](https://github.com/nomiclabs/hardhat): compile, run and test smart contracts
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript bindings for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Solhint](https://github.com/protofire/solhint): code linter
- [Solcover](https://github.com/sc-forks/solidity-coverage): code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

based on [Paul Razvan Berg's great hardhat-template](https://github.com/PaulRBerg/hardhat-template).

## Getting Started

This `SimpleStorage` example accompanies the guide on [How to write an upgradeable plugin](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/upgradeable-plugin/) from the Aragon Developer Portal.

### VSCode Integration

This example is IDE agnostic, but for the best user experience, you may want to use it in VSCode alongside Nomic Foundation's [Solidity extension](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity).

### GitHub Actions

This template comes with GitHub Actions pre-configured. Your contracts will be linted and tested on every push and pull request made to the `main` branch.

Note though that to make this work, you must add your `INFURA_API_KEY` as a [GitHub secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

You can edit the CI script in [.github/workflows/ci.yml](./.github/workflows/ci.yml).

## Usage

### Pre Requisites

Before being able to run any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment variable. To test the contracts against the current Aragon ethereum mainnet version, you must also set an Infura API key. If you don't already an Infura API key, you can sign up for [Infura ] https://app.infura.io/login.

Then, proceed with installing dependencies:

```sh
$ pnpm install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ pnpm compile
```

### TypeChain

Compile the smart contracts and generate TypeChain bindings:

```sh
$ pnpm typechain
```

### Test

Run the tests with Hardhat:

```sh
$ pnpm test
```

### Lint Solidity

Lint the Solidity code:

```sh
$ pnpm lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ pnpm lint:ts
```

### Coverage

Generate the code coverage report:

```sh
$ pnpm coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true pnpm test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ pnpm clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ pnpm deploy
```

## Tips

### Syntax Highlighting

If you use VSCode, you can get Solidity syntax highlighting with the [hardhat-solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity) extension.

## Using GitPod

[GitPod](https://www.gitpod.io/) is an open-source developer platform for remote development.

To view the coverage report generated by `pnpm coverage`, just click `Go Live` from the status bar to turn the server on/off.

## License

This project is licensed under AGPL-3.0-or-later.
