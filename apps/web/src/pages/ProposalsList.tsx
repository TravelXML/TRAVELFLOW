import { useState } from "react";
import { Link } from "react-router-dom";
import { useProposals } from "../hooks/useProposals";
import { ProposalTable } from "../components/proposal/ProposalTable";
import { Button } from "../components/common/Button";
import { ProposalStatus } from "../types";

const STATUS_FILTERS: { label: string; value: ProposalStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Opened", value: "opened" },
  { label: "Clicked", value: "clicked" },
  { label: "Booked", value: "booked" },
];

export default function ProposalsList() {
  const [status, setStatus] = useState<ProposalStatus | undefined>(undefined);
  const { data, isLoading } = useProposals(status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
          <p className="text-sm text-slate-500">{data ? `${data.total} total` : " "}</p>
        </div>
        <Link to="/proposals/new">
          <Button>New proposal</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              status === filter.value ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-slate-400">Loading proposals...</div>
      ) : (
        <ProposalTable proposals={data.proposals} />
      )}
    </div>
  );
}
