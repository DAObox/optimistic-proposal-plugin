import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`\n10: Creating OptimisticProposalSetup.`);
  await deploy("OptimisticProposalSetup", {
    from: deployer,
    log: true,
  });
};

export default func;
func.tags = ["CreateOptimisticProposalSetup"];
