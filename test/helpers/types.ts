import {BigNumber} from 'ethers';

export type VersionTag = {release: BigNumber; build: BigNumber};

export enum Operation {
  Grant,
  Revoke,
  GrantWithCondition,
}

export const ProposalStatus = {
  Active: 0,
  Paused: 1,
  Cancelled: 2,
  RuledAllowed: 3,
  RuledRejected: 4,
  Executed: 5,
};
