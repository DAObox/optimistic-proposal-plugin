import { useContractRead } from "wagmi";
import { opConfig } from "../op-helpers";

export const useOpCollateral = () => {
  let collateral;
  const { data, error, status } = useContractRead({
    ...opConfig,
    functionName: "proposalCollateral",
  });
  if (data) collateral = data;

  return { collateral, error, status };
};
