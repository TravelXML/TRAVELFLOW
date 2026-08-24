import clsx from "clsx";
import { ProposalStatus } from "../../types";

const STATUS_STYLES: Record<ProposalStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-amber-100 text-amber-700",
  clicked: "bg-purple-100 text-purple-700",
  booked: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}
