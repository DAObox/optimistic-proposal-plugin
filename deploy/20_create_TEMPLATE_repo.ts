import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { newPluginRepo } from "./helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers, network } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const { address: setupAddress } = await get("Template");

  const networkName = network.name === "local" ? "mainnet" : network.name;

  const buildMetadataCid = "";
  const releaseMetadataCid ="";

  console.warn(
    `\n20: Creating Template repo \nPlease make sure pluginRepo is not created more than once with the same subdomain.`
  );

  await newPluginRepo({
    subdomain: "Template",
    setupAddress,
    deployer,
    networkName,
    signer,
    buildMetadataCid,
    releaseMetadataCid,
  });
};

export default func;
func.tags = ["CreateTemplateRepo"];
