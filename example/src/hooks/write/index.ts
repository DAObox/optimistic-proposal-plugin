import { BigNumber } from "ethers";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { Action, Bytes32 } from "~/types";
import { opConfig } from "../op-helpers";

import { useOpCollateral } from "../read";

interface NewOpProposalParams {
  metadata: Bytes32;
  actions: Action[];
  allowFailureMap: BigNumber;
}

export const useNewOpProposal = ({
  metadata,
  actions,
  allowFailureMap,
}: NewOpProposalParams) => {
  const { collateral } = useOpCollateral();

  const { config, status: prepareStatus } = usePrepareContractWrite({
    ...opConfig,
    functionName: "createProposal",
    args: [metadata, actions, allowFailureMap],
    enabled: !!(metadata && actions && allowFailureMap && collateral),
    overrides: {
      value: collateral?.add(420),
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
