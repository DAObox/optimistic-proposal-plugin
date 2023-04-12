import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`\n10: Creating TEMPLATE_SETUP.`);
  await deploy("TEMPLATE_SETUP", {
    from: deployer,
    log: true,
  });
};

export default func;
func.tags = ["CreateTEMPLATE_SETUP"];
