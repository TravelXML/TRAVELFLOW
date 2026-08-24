import { ProposalForm } from "../components/proposal/ProposalForm";

export default function ProposalNew() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New proposal</h1>
        <p className="text-sm text-slate-500">Fill in the trip details - flights, hotels, activities, and a day-by-day itinerary are generated automatically.</p>
      </div>
      <ProposalForm />
    </div>
  );
}
