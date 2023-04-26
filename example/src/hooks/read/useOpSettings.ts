import { useContractReads } from "wagmi";
import { opConfig } from "../op-helpers";

export const useOpSettings = () => {
  let settings;
  const { data, error, status } = useContractReads({
    contracts: [
      { ...opConfig, functionName: "proposalCollateral" },
      { ...opConfig, functionName: "executionDelay" },
      { ...opConfig, functionName: "arbitrator" },
      { ...opConfig, functionName: "arbitratorExtraData" },
      { ...opConfig, functionName: "metaEvidence" },
      { ...opConfig, functionName: "proposalCount" },
    ],
  });
  if (data) {
    settings = {
      proposalCollateral: data[0],
      executionDelay: data[1],
      arbitrator: data[2],
      arbitratorExtraData: data[3],
      metaEvidence: data[4],
      proposalCount: data[5],
    };
  }

  return { settings, error, status };
};
