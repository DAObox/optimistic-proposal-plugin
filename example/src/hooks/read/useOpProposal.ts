import { useContractRead } from "wagmi";
import { BigNumber } from "@ethersproject/bignumber";
import { ProposalDetails } from "~/types";
import { opConfig, BN, parseProposalDetails } from "../op-helpers";

export const useOpProposal = (id: number | bigint | BigNumber) => {
  let proposal: ProposalDetails | undefined;
  const { data, isSuccess, isError, isLoading, error, status } =
    useContractRead({
      ...opConfig,
      functionName: "getProposal",
      args: [BN(id)],
      enabled: !!id,
    });

  if (data) proposal = parseProposalDetails(data);
  return { proposal, isSuccess, isError, isLoading, error, status };
};
