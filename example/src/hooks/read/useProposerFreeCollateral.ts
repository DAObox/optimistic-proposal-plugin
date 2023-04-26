import { Address, useContractRead } from "wagmi";
import { BigNumber } from "@ethersproject/bignumber";
import { opConfig } from "../op-helpers";

export const useProposerFreeCollateral = (address: Address) => {
  let freeCollateral: BigNumber | undefined;
  const { data, error, status } = useContractRead({
    ...opConfig,
    functionName: "proposerFreeCollateral",
    args: [address],
    enabled: !!address,
  });

  if (data) freeCollateral = data;
  return { freeCollateral, error, status };
};
