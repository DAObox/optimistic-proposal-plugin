import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`\n10: Creating OptimisticProposalPlugin. JUST TO TEST GAS COSTS`);
  await deploy("OptimisticProposalPlugin", {
    from: deployer,
    log: true,
  });
};

export default func;
func.tags = ["CreateOptimisticProposalPlugin"];
