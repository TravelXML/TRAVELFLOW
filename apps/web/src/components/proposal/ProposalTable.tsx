import { Link } from "react-router-dom";
import { ProposalSummary } from "../../types";
import { StatusBadge } from "../common/Badge";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ProposalTable({ proposals }: { proposals: ProposalSummary[] }) {
  if (proposals.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">No proposals yet</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Destination</th>
            <th className="px-4 py-3 font-medium">Travel dates</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((p) => (
            <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link to={`/proposals/${p.id}`} className="font-medium text-brand hover:underline">
                  {p.customerName}
                </Link>
                <div className="text-xs text-slate-400">{p.customerEmail}</div>
              </td>
              <td className="px-4 py-3">{p.destinationName}</td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(p.travelStartDate)} – {formatDate(p.travelEndDate)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
