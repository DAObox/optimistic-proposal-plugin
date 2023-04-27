import React from "react";
import { Page } from "~/components/Page";
import {
  useCanCreateOpProposal,
  useOpProposal,
  useOpProposals,
  useOpSettings,
} from "~/hooks/read";
import { useAccount } from "wagmi";
import { ethFormatter } from "~/lib/ethFormatter";
import { timeFormatter } from "~/lib/timeFormatter";
import { ProposalDetails } from "~/types";

function ProposalCard(props: ProposalDetails | undefined) {
  return (
    <div className="card bg-base-300 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Shoes!</h2>
        <p>If a dog chews shoes whose shoes does he choose?</p>
        <div className="card-actions justify-end">
          <button className="btn-error btn-xs rounded-lg">CHALLANGE</button>
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  const { proposals, hasNextPage, fetchNextPage } = useOpProposals();
  const { proposal } = useOpProposal(1);
  console.log({ proposal });
  console.log({ proposals });
  return (
    <Page rightColumn={<SettingsStats />}>
      <div className="w-max p-2">
        {proposals &&
          proposals.map((proposal, index) => (
            <ProposalCard key={index} {...proposal} />
          ))}
      </div>
    </Page>
  );
};

export default Index;

const SettingsStats = () => {
  const { address } = useAccount();
  const { settings, status: settingsStatus } = useOpSettings();
  const { isMember, status: isMemberStatus } = useCanCreateOpProposal(address);

  const { proposalCollateral, executionDelay } = settings ?? {};

  return (
    <div className="stats stats-vertical shadow">
      <div className="stat">
        <div className="stat-title">Required Collateral</div>
        <div className="stat-value">
          {proposalCollateral
            ? ethFormatter(proposalCollateral?.toString())
            : "Loading..."}
        </div>
        <div className="stat-desc">+ 420 gwei arbitration fee</div>
      </div>

      <div className="stat">
        <div className="stat-title">Execution Delay</div>
        <div className="stat-value">
          {executionDelay ? timeFormatter(executionDelay) : "Loading..."}
        </div>
        <div className="stat-desc">Days : Hours : Munites</div>
      </div>

      <div className="stat">
        <div className="stat-title">Can You Create Proposals</div>
        <div className="stat-value">{isMember ? "YES" : isMemberStatus}</div>
        <div className="stat-desc line-clamp-1">{address}</div>
      </div>
    </div>
  );
};
