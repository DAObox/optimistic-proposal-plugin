import { BigNumber } from "ethers";

export enum DisputeStatus {
  NoDispute, // No dispute exists for the proposal.
  DisputeCreated, // The dispute has been created.
  Resolved, // The dispute has been resolved.
}

export enum OPProposalStatus {
  Active, // A delayed action that is in the queue.
  Paused, // A delayed action that is being challenged.
  Cancelled, // A delayed action that has been cancelled.
  RuledAllowed, // A delayed action that has been ruled allowed by the arbitrator.
  RuledRejected, // A delayed action that has been ruled disallowed by the arbitrator.
  Executed, // A delayed action that has been executed.
}

export interface UseProposalProps {
  start?: number;
  perPage?: number;
  direction?: "decrement" | "increment";
}

export interface ProposalDetails {
  disputeStatus: DisputeStatus; // The status of the dispute related to the proposal.
  status: OPProposalStatus; // The current status of the proposal.
  executionFromTime: BigNumber; // The earliest timestamp at which the proposal can be executed.
  pausedAtTime: BigNumber; // The timestamp at which the proposal was paused due to a challenge.
  disputeId: BigNumber; // The ID of the dispute related to the proposal.
  proposer: string; // The address of the proposal's proposer.
  proposerCollateral: BigNumber; // The proposer's collateral at stake above the fees for a rejected proposal
  proposerPaidFees: BigNumber; // The amount of fees paid by the proposer.
  challenger: string; // The address of the proposal's challenger.
  challengerPaidFees: BigNumber; // The amount of fees paid by the challenger.
  allowFailureMap: BigNumber; // A map indicating which actions are allowed to fail during execution.
  metadata: string; // Additional metadata related to the proposal.
  actions: Action[];
}

export interface Action {
  to: Address;
  value: BigNumber;
  data: Bytes32;
}

export type IPFSURI = `ipfs://${string}`;
export type Bytes32 = `0x${string}`;
export type Address = Bytes32;
