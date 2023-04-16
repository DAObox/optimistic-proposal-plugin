import {IPluginInstallItem} from '@aragon/sdk-client';
import {defaultAbiCoder} from 'ethers/lib/utils';
import {hexToBytes} from './hexTools';

export interface EncodePluginInstallationProps {
  types: string[];
  repoAddress: string;
  parameters: any[];
}

/**
 * Encodes plugin installation parameters based on the provided human-readable ABI, repository address, and parameters.
 *
 * @param {EncodePluginInstallationProps} props - The properties to encode the plugin installation parameters.
 * @param {string[]} props.types - The human-readable ABI of the function.
 * @param {string} props.repoAddress - The repository address of the plugin.
 * @param {any[]} props.parameters - The array containing values to be encoded according to the human-readable ABI.
 * @returns {IPluginInstallItem} - The encoded plugin installation item.
 *
 * @example
 * const exampleTypes = [
 *   "address contractOwner",
 *   "uint256 tokenAmount",
 *   "tuple(bool active, string tokenSymbol) tokenData"
 * ];
 *
 * const exampleParameters = [
 *   "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
 *   1234,
 *   { active: true, tokenSymbol: "TKN" }
 * ];
 *
 * const encodedData = encodePluginInstallationParameters({
 *   types: exampleTypes,
 *   repoAddress: "YOUR_PLUGIN_REPO_ADDRESS",
 *   parameters: exampleParameters
 * });
 */
export function encodePluginInstallItem({
  types,
  repoAddress,
  parameters,
}: EncodePluginInstallationProps): IPluginInstallItem {
  const hexBytes = defaultAbiCoder.encode(types, parameters);

  return {
    id: repoAddress,
    data: hexToBytes(hexBytes),
  };
}
