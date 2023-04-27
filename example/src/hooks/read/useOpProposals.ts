import { paginatedIndexesConfig, useContractInfiniteReads } from "wagmi";
import { ProposalDetails, UseProposalProps } from "~/types";
import { useOpProposalsCount } from "./useOpProposalsCount";
import { opConfig, BN, parseProposalDetails } from "../op-helpers";

export const useOpProposals = ({
  start = 0,
  perPage = 10,
  direction = "decrement",
}: UseProposalProps = {}) => {
  const { count } = useOpProposalsCount();
  const index = count ?? 0;
  let proposals: Array<ProposalDetails | undefined> = [];
  const { data, error, status, hasNextPage, fetchNextPage } =
    useContractInfiniteReads({
      cacheKey: "proposals",
      ...paginatedIndexesConfig(
        (index) => {
          return [
            {
              ...opConfig,
              functionName: "getProposal",
              args: [BN(index)] as const,
            },
          ];
        },
        { start, perPage, direction }
      ),
      enabled: !!(index && index > 0),
    });

  if (data) {
    proposals = data.pages.flatMap((page) =>
      page.map((proposal) => parseProposalDetails(proposal))
    );
  }

  return {
    proposals,
    error,
    status,
    hasNextPage,
    fetchNextPage,
  };
};
