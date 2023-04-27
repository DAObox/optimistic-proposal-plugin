import { BigNumber, BigNumberish } from "ethers";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { Action, Bytes32 } from "~/types";
import { BN, opConfig } from "../op-helpers";

import { useOpCollateral } from "../read";

interface NewOpProposalParams {
  metadata: Bytes32;
  actions: Action[];
  allowFailureMap: BigNumberish;
}

export const useNewOpProposal = ({
  metadata,
  actions,
  allowFailureMap = BN(0),
}: NewOpProposalParams) => {
  const { collateral } = useOpCollateral();

  const isEnabled = () => {
    console.log({ metadata, actions, allowFailureMap, collateral });
    return !!(metadata && actions && allowFailureMap && collateral);
  };

  const { config, status: prepareStatus } = usePrepareContractWrite({
    ...opConfig,
    functionName: "createProposal",
    args: [metadata, actions, BN(allowFailureMap)],
    enabled: isEnabled(),
    overrides: {
      value: collateral?.add(100000000000000),
    },
  });

  const { data, status, write, error } = useContractWrite({
    ...config,

    // onError(err) {
    //   console.log(err);
    // },
    // onSuccess: (tx) => {
    //   console.log(tx.hash);
    // },
  });

  //   console.log("useNewOpProposal", { data, status, error, prepareStatus });
  return { data, status, write, error, prepareStatus };
};
