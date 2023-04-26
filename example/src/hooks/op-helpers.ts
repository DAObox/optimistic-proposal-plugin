import config from "../test-config";
import { Address } from "wagmi";
import OptimisticProposalsABI from "~/abi/OptimisticProposalsABI";
import { ethers } from "ethers";
import {
  ProposalDetails,
  DisputeStatus,
  Action,
  OPProposalStatus,
} from "~/types";

export const BN = ethers.BigNumber.from;
export const opConfig = {
  address: config.plugin as Address,
  abi: OptimisticProposalsABI,
};

export const parseProposalDetails = (data: any) => {
  if (data) {
    const proposal: ProposalDetails = {
      disputeStatus: data.disputeStatus as DisputeStatus,
      status: data.status as OPProposalStatus,
      executionFromTime: data.executionFromTime,
      pausedAtTime: data.pausedAtTime,
      disputeId: data.disputeId,
      proposer: data.proposer,
      proposerCollateral: data.proposerCollateral,
      proposerPaidFees: data.proposerPaidFees,
      challenger: data.challenger,
      challengerPaidFees: data.challengerPaidFees,
      metadata: data.metadata,
      actions: data.actions as Action[],
      allowFailureMap: data.allowFailureMap,
    };
    return proposal;
  }
  return undefined;
};
